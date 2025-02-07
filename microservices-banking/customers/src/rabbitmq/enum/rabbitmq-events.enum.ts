export enum RabbitmqRoutingKeys {
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DEPOSIT = 'user.deposit',
  USER_EXCHANGE = 'user-exchange',
  TRANSACTION_EXCHANGE = 'transaction-exchange',
  TRANSACTION_COMPLETED = 'transaction.completed',
  USER_TRANSACTION_COMPLETED = 'user-transaction-completed',
  TRANSACTION_CANCELED = 'transaction_canceled',
  USER_TRANSACTION_CANCELED = 'user_transaction_canceled',
  TYPE = 'direct',
}
