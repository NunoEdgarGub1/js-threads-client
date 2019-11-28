import { expect } from 'chai'
import { NodeHttpTransport } from '@improbable-eng/grpc-web-node-http-transport'
import { Client } from '../index'

const host = 'http://localhost:9091'
let client: Client

describe('basic client', function() {
  before(() => {
    client = new Client(NodeHttpTransport())
  })

  describe('.version', function() {
    it('result should be defined', async () => {
      expect(Client.version()).to.not.be.undefined
    })
  })
  describe('.setHost', function() {
    it('result should be defined', async () => {
      expect(client.setHost(host)).to.not.be.undefined
    })
  })
})
