export enum RabbitmqRoutingKeys {
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DEPOSIT = 'user.deposit',
  USER_EXCHANGE = 'user-exchange',
  TRANSACTION_EXCHANGE = 'transaction-exchange',
  TRANSACTION_COMPLETED = 'transaction.completed',
  USER_TRANSACTION_COMPLETED = 'user-transaction-completed',
  TRASACTION_USER_CREATED = 'transaction-user-created',
  TRANSACTION_CANCELED = 'transaction_canceled',
  TYPE = 'direct',
}
