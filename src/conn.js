import * as driver from 'bigchaindb-driver' // eslint-disable-line import/no-namespace


export default class BigchainDBGraphQLConnection {
    constructor(path, headers = {}) {
        this.path = path
        this.headers = Object.assign({}, headers)
        this.conn = new driver.Connection(path, headers)
    }

    getTransaction(transactionId) {
        return this.conn.getTransaction(transactionId)
    }

    listTransactions(assetId, operation) {
        return this.conn.listTransactions(assetId, operation)
    }

    listOutputs(publicKey, spent) {
        return this.conn.listOutputs(publicKey, spent)
    }

    getBlock(blockId) {
        return this.conn.getBlock(blockId)
    }

    listBlocks(transactionId) {
        return this.conn.listBlocks(transactionId)
            .then(blockIds => Promise.all(
                blockIds.map(blockId => this.conn.getBlock(blockId))
            ))
    }

    listVotes(blockId) {
        return this.conn.listVotes(blockId)
    }

    searchAssets(text) {
        return this.conn.searchAssets(text)
            .then(assetList => Promise.all(
                assetList.map(asset => this.conn.getTransaction(asset.id))
            ))
    }
}
