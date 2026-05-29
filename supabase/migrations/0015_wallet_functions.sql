-- 0015_wallet_functions.sql
-- Atomic wallet operations. Doing balance/stock checks and mutations inside a
-- single SQL function avoids the check-then-write races that plague REST clients.

-- Buy one unit of a product: validates stock + balance, decrements both, logs a
-- wallet_transaction. Raises a coded exception the API maps to a 4xx.
create or replace function purchase_product(
  p_gym_id    uuid,
  p_member_id uuid,
  p_product_id uuid
) returns jsonb
language plpgsql
as $$
declare
  v_product products%rowtype;
  v_balance numeric(10,2);
  v_txn_id  uuid;
  v_remaining int;
  v_low_stock boolean := false;
begin
  select * into v_product from products
    where id = p_product_id and gym_id = p_gym_id
    for update;
  if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
  if not v_product.is_active then raise exception 'PRODUCT_INACTIVE'; end if;
  if v_product.stock_quantity <= 0 then raise exception 'OUT_OF_STOCK'; end if;

  select balance into v_balance from wallet_accounts
    where gym_id = p_gym_id and member_id = p_member_id
    for update;
  if v_balance is null then raise exception 'NO_WALLET'; end if;
  if v_balance < v_product.price then raise exception 'INSUFFICIENT_BALANCE'; end if;

  update wallet_accounts set balance = balance - v_product.price
    where gym_id = p_gym_id and member_id = p_member_id;

  update products set stock_quantity = stock_quantity - 1
    where id = p_product_id
    returning stock_quantity into v_remaining;
  v_low_stock := v_remaining <= v_product.low_stock_threshold;

  insert into wallet_transactions (gym_id, member_id, type, amount, description, reference_id)
    values (p_gym_id, p_member_id, 'purchase', -v_product.price, v_product.name, p_product_id)
    returning id into v_txn_id;

  return jsonb_build_object(
    'transaction_id', v_txn_id,
    'new_balance', v_balance - v_product.price,
    'product_id', p_product_id,
    'product_name', v_product.name,
    'amount', v_product.price,
    'remaining_stock', v_remaining,
    'low_stock', v_low_stock
  );
end;
$$;

-- Credit a wallet (top-up, refund, referral). Upserts the account, logs a
-- positive wallet_transaction, returns the new balance.
create or replace function credit_wallet(
  p_gym_id      uuid,
  p_member_id   uuid,
  p_amount      numeric,
  p_type        text,
  p_description text,
  p_reference   uuid
) returns jsonb
language plpgsql
as $$
declare
  v_balance numeric(10,2);
  v_txn_id  uuid;
begin
  if p_amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;

  insert into wallet_accounts (gym_id, member_id, balance)
    values (p_gym_id, p_member_id, p_amount)
    on conflict (gym_id, member_id)
    do update set balance = wallet_accounts.balance + excluded.balance
    returning balance into v_balance;

  insert into wallet_transactions (gym_id, member_id, type, amount, description, reference_id)
    values (p_gym_id, p_member_id, p_type, p_amount, p_description, p_reference)
    returning id into v_txn_id;

  return jsonb_build_object('transaction_id', v_txn_id, 'new_balance', v_balance);
end;
$$;

-- Debit a wallet for a fee (no-show, late-cancel). Allows the balance to go
-- negative so fees are always recorded; the booking layer decides whether a
-- negative effective balance blocks future actions.
create or replace function debit_wallet_fee(
  p_gym_id      uuid,
  p_member_id   uuid,
  p_amount      numeric,
  p_description text,
  p_reference   uuid
) returns jsonb
language plpgsql
as $$
declare
  v_balance numeric(10,2);
  v_txn_id  uuid;
begin
  if p_amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;

  insert into wallet_accounts (gym_id, member_id, balance)
    values (p_gym_id, p_member_id, -p_amount)
    on conflict (gym_id, member_id)
    do update set balance = wallet_accounts.balance + excluded.balance
    returning balance into v_balance;

  insert into wallet_transactions (gym_id, member_id, type, amount, description, reference_id)
    values (p_gym_id, p_member_id, 'fee', -p_amount, p_description, p_reference)
    returning id into v_txn_id;

  return jsonb_build_object('transaction_id', v_txn_id, 'new_balance', v_balance);
end;
$$;
