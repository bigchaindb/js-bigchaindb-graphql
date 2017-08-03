# GraphQL for BigchainDB in JavaScript

This is an example GraphQL api running on top of the BigchainDB JavaScript driver.

The code does not talk to the backend database directly. It just retrieves
whatever data it needs using the JavaScript driver and constructs the GraphQL
objects from the returned json.

## Setup

```bash
$ npm install bigchaindb-graphql
```
or 

```bash
$ yarn add bigchaindb-graphql
```

(Optional) Prepopulate BigchainDB with the example transactions, see [here](https://github.com/bigchaindb/graphql-bigchaindb):
```bash
$ python prepopulate.py
```
These are the transactions used in the examples below.

```bash
npm run test
```

## Usage

```javascript
import { graphql } from 'graphql'
import {
    BigchainDBGraphQLConnection,
    BigchainDBGraphQLSchema
} from 'bigchaindb-graphql'

const BigchainDBSchema = new BigchainDBGraphQLSchema(
    new BigchainDBGraphQLConnection("<connection details eg. 'http://localhost:9984/api/v1/', headers>")
).schema

const queryTransaction = `
{
    transaction(id: "3b3fd7128580280052595b9bcda98895a851793cba77402ca4de0963be958c9e") {
        id
        operation
        asset
        metadata
    } 
}
`

graphql(BigchainDBSchema, queryTransaction).then(result => {
    console.log(JSON.stringify(result, null, 2))
})
```

## Examples

After prepopulating BigchainDB with the transactions provided you can run the following queries in the browser or node.

- Query a transaction:
```graphql
query {
    transaction(id:"3b3fd7128580280052595b9bcda98895a851793cba77402ca4de0963be958c9e") {
        id
        operation
        asset
        # we don't care about the inputs
        # inputs

        # from the outputs we don't care about the condition so we only want
        # the amount and public keys
        outputs {
            amount
            public_keys
        }

        # we don't care about the metadata
        # metadata
    }
}
```

- Query multiple transactions by asset id:
```graphql
query {
    transactions(asset_id:"3b3fd7128580280052595b9bcda98895a851793cba77402ca4de0963be958c9e") {
        # For each transaction returned I only want the id, operation and
        # public keys in the outputs
        id
        operation
        outputs {
            public_keys
        }
    }
}
```

- Query only transfer transactions with asset id:
```graphql
query {
    transactions(asset_id:"3b3fd7128580280052595b9bcda98895a851793cba77402ca4de0963be958c9e", operation:"TRANSFER") {
        # I only want the public keys and amounts of all the outputs that this
        # transfer transaction fulfills
        inputs {
            fulfills {
                output_index
                # the `transaction_id` inside fulfills is resolved to the
                # actual transaction so we can query fields on the transaction
                # pointed to in this inputs, notice that this can go as deep as you like
                transaction {
                    outputs {
                        amount
                        public_keys
                    }
                }
            }
        }
    }
}
```

- Query the blocks and votes for a transaction:
```graphql
query {
    transaction(id:"3b3fd7128580280052595b9bcda98895a851793cba77402ca4de0963be958c9e") {
        # I want to know the blocks, votes and respective timestamps of a transaction
        asset
        metadata
        blocks {
            block {
                node_pubkey
                timestamp
            }
            votes {
                node_pubkey
                vote {
                    timestamp
                }
            }
        }
    }
}
```

- Query the outputs endpoint by public key
```graphql
query {
    outputs(publicKey:"FxEfUt9ArymGeCB99dZtfCUcsKwC29c8AHZ9EPnVWcyL") {
        output_index
        # once again the transaction_id is resolved to the actual transaction
        transaction {
           id
           operation
           asset
        }
    }
}
```

- Query the outputs endpoint by public key
```graphql
query {
    outputs(publicKey:"FxEfUt9ArymGeCB99dZtfCUcsKwC29c8AHZ9EPnVWcyL") {
        output_index
        # once again the transaction_id is resolved to the actual transaction
        transaction {
           id
           operation
           asset
        }
    }
}
```

- Query a block and the associated votes:
```graphql
query {
    block(id: "c44c06985175ee0cf210fff65c44e63aa06300999e5e7654e13678582522e8f0") {
        id
        block {
            timestamp
            transactions {
                id
            }
            node_pubkey
            voters
        }
        votes {
            vote {
                timestamp
            }
        }
        signature
    } 
}
```

- Query the votes for a specific block
```graphql
query {
    votes(block_id: "c44c06985175ee0cf210fff65c44e63aa06300999e5e7654e13678582522e8f0") {
        node_pubkey
        signature
        vote {
            voting_for_block
            previous_block
            is_block_valid
            invalid_reason
            timestamp
        }
    } 
}
```

- Do a text-search on transactions that matches the asset fields/values:
```graphql
query {
    search(text: "b") {
        id
        asset
    } 
}
```
