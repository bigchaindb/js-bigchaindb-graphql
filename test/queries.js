import * as driver from 'bigchaindb-driver' // eslint-disable-line import/no-namespace
import bip39 from 'bip39'
import { graphql } from 'graphql'
import {
    BigchainDBGraphQLConnection,
    BigchainDBGraphQLSchema
} from '../src/index'

const BigchainDBSchema = new BigchainDBGraphQLSchema(
    new BigchainDBGraphQLConnection('http://localhost:9984/api/v1/')
).schema

// generate keypairs for transaction & transfer
const mnemonic = bip39.generateMnemonic()
const keypairer = (seed) => new driver.Ed25519Keypair(seed.slice(0, 32))
const keypair = keypairer(bip39.mnemonicToSeed(mnemonic))

const queryTransaction = `
{
    transaction(id: "3b3fd7128580280052595b9bcda98895a851793cba77402ca4de0963be958c9e") {
        id
        operation
        asset
        metadata
        inputs {
            owners_before
            fulfillment
            fulfills {
                output_index
                transaction {
                    id
                    asset
                    metadata
                    inputs {
                        fulfills {
                            transaction {
                                id
                            }
                        }
                    }
                }
            }
        }
        outputs {
            condition
            public_keys
            amount
        }
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
`

const queryTransactionList = `
{
    transactions(asset_id: "3b3fd7128580280052595b9bcda98895a851793cba77402ca4de0963be958c9e") {
        id
        operation
        blocks {
            block {
                timestamp
            }
        }
    }
}
`

const queryOutputList = `
{
    outputs(public_key: "FxEfUt9ArymGeCB99dZtfCUcsKwC29c8AHZ9EPnVWcyL", spent: false) {
        output_index
        transaction {
            id
            metadata
            blocks {
                block {
                    timestamp
                }
            }
        }
    }
}
`

const queryBlock = `
{
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
`

const queryBlockList = `
{
    blocks(transaction_id: "3b3fd7128580280052595b9bcda98895a851793cba77402ca4de0963be958c9e") {
        id
        block {
            timestamp
        }
        signature
    }
}
`

const queryVoteList = `
{
    votes(block_id: "3b3fd7128580280052595b9bcda98895a851793cba77402ca4de0963be958c9e") {
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
`

const querySearch = `
{
    search(text: "b") {
        id
        asset
    }
}
`

const transactionPayload = '{ myassetdata: "myassetvalue" }'.toString()
const transactionMetadata = '{ mymetadata: "mymetavalue" }'.toString()
const mutationTransaction = `
mutation {
    transaction(
        publicKey: "${keypair.publicKey}",
        privateKey: "${keypair.privateKey}",
        payload: ${transactionPayload},
        metadata: ${transactionMetadata}
    ) {
        id
        operation
        asset
        metadata
        inputs {
            owners_before
            fulfillment
            fulfills {
                output_index
                transaction {
                    id
                    asset
                    metadata
                    inputs {
                        fulfills {
                            transaction {
                                id
                            }
                        }
                    }
                }
            }
        }
        outputs {
            condition
            public_keys
            amount
        }
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
`
const transactionToTransfer = '{inputs: [{owners_before: ["FxEfUt9ArymGeCB99dZtfCUcsKwC29c8AHZ9EPnVWcyL"], fulfills: {transaction_id: "3b3fd7128580280052595b9bcda98895a851793cba77402ca4de0963be958c9e", output_index: 0}, fulfillment: "pGSAIN4qAsNI5BTBBPG_-rku7U1_3LP3OQCOxJwYNVeYFDwXgUClHrUJn0R27q74iNfOu42TH8Dj1VJKiIlTv2fGdzwYKTpXt5J08dZa4_SI6yg1OajX3vVV3Dir1-qr_SGFwIwC"}], outputs: [{public_keys: ["FxEfUt9ArymGeCB99dZtfCUcsKwC29c8AHZ9EPnVWcyL"], condition: {details: {type: "ed25519-sha-256", public_key: "FxEfUt9ArymGeCB99dZtfCUcsKwC29c8AHZ9EPnVWcyL"}, uri: "ni:///sha-256;BX6oMTzQB_2xyFRExF1-w5ZwfuiWVzIfJAzVWyn7dCQ?fpt=ed25519-sha-256&cost=131072"}, amount: "1"}], operation: "TRANSFER", metadata: null, asset: {id: "3b3fd7128580280052595b9bcda98895a851793cba77402ca4de0963be958c9e"}, version: "1.0", id: "b4b8bec52f56a327b6f2455d9dc6ee576a9ebe1eb7f564447c15dd5e2dd23b28"}'.toString()
const transferMetadata = '{ mymetadata: "mymetavalue2" }'.toString()
const mutationTransfer = `
mutation {
    transfer(
        tx: ${transactionToTransfer},
        fromPublicKey: "${keypair.publicKey}",
        fromPrivateKey: "${keypair.privateKey}",
        toPublicKey: "${keypair.publicKey}",
        metadata: ${transferMetadata}
    ) {
        id
        operation
        asset
        metadata
        inputs {
            owners_before
            fulfillment
            fulfills {
                output_index
                transaction {
                    id
                    asset
                    metadata
                    inputs {
                        fulfills {
                            transaction {
                                id
                            }
                        }
                    }
                }
            }
        }
        outputs {
            condition
            public_keys
            amount
        }
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
`

graphql(BigchainDBSchema, queryTransaction).then(result => {
    console.log(JSON.stringify(result, null, 2))
})
graphql(BigchainDBSchema, queryTransactionList).then(result => {
    console.log(JSON.stringify(result, null, 2))
})
graphql(BigchainDBSchema, queryOutputList).then(result => {
    console.log(JSON.stringify(result, null, 2))
})
graphql(BigchainDBSchema, queryBlock).then(result => {
    console.log(JSON.stringify(result, null, 2))
})
graphql(BigchainDBSchema, queryBlockList).then(result => {
    console.log(JSON.stringify(result, null, 2))
})
graphql(BigchainDBSchema, queryVoteList).then(result => {
    console.log(JSON.stringify(result, null, 2))
})
graphql(BigchainDBSchema, querySearch).then(result => {
    console.log(JSON.stringify(result, null, 2))
})
graphql(BigchainDBSchema, mutationTransaction).then(result => {
    console.log(JSON.stringify(result, null, 2))
})
graphql(BigchainDBSchema, mutationTransfer).then(result => {
    console.log(JSON.stringify(result, null, 2))
})
