import { Connection, createConnection } from 'typeorm'

import { getConnectionOptions } from 'typeorm'

export async function testConnection(drop = false): Promise<Connection> {
  let connectionOptions = await getConnectionOptions()
  connectionOptions = {
    ...connectionOptions,
    synchronize: drop,
    dropSchema: drop,
  }
  return createConnection(connectionOptions)
}
