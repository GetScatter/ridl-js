# RIDL JS

RIDL is a multi-chain reputation and identity layer which promotes on-chain reputing of entities.
This library is a simple wrapper around the RIDL API which is used to allow EOSIO contracts to
not require users to have EOSIO accounts (public key pinning).

## Instantiation

#### Nodejs
```js
const RidlJS = require('ridljs');

// https://github.com/EOSIO/eosjs-ecc/
const signer = hash => ecc.signHash(hash, someKey);

const ridl = RidlJS(signer);
```

#### Browser
```js
<script src="./ridl.js"></script>

... same as above
```

## Methods

#### Get Chains
Gets a list of the currently used chains for RIDL
```js
const chains = await ridl.chains();
// ['chain_id1', 'chain_id2',]
```

#### Get Hosts
Gets a list of the currently used hosts for a chain
```js
const hosts = await ridl.hosts(chain);
// ['https://node.com']
```

#### Add host

**This method is turned off on the API for now**.

Suggest a node/host to be added for a chain.
Specific requirements for this method will be posted here when it is live.
```js
const options = {
    logic_contract:'ridlridlridl',
    token_contract:'ridlridltkns',
    sender_account:'ridlridlsend,
    creator_account:'ridlridluser',
};

const added = await ridl.addHost(chain_id, host, options);
```

#### Find Identity
Finds an identity by username.

**You should be doing this to find the identity's `id` and `chain` before calling `repute()` or `changekey()`**.
```js
const identity = await ridl.findIdentity(username);
```

#### Find Reputation
Finds a reputation by entity.
```js
const entity = 'contract::eosio.token';
const identity = await ridl.findReputation(entity);
```

#### Register Identity
Finds a reputation by entity.
```js
const result = await ridl.identify(username, publicKey);
if(result && result.success) ...
else console.error(result);
```

#### Change Identity Key
Finds a reputation by entity.
```js
const result = await ridl.changekey(identity.id, new_public_key, identity.chain);
if(result && result.success) ...
else console.error(result);
```

#### Apply Reputation
Finds a reputation by entity.
```js
const entity = 'contract::ridlridlridl';
const fragments = [{type:'testing', value:1}];
const tokens = '1.0000 RIDL';
const details = 'I think this contract is awesome!';

const result = await ridl.repute(identity.id, entity, fragments, tokens, identity.chain, details);
if(result && result.success) ...
else console.error(result);
```


#### Special notes about `changekey` and `repute`.

Both of these methods can also take a `block_num` and `sig` parameter (always the last two params).
These are used to sign a proofing hash which the smart contracts use to make sure no parameters were tampered with.
**This library does it by default** when a `block_num` is `null`, but you can do it yourself like so:
```js
// For `changekey(..., block_num, sig)`
const sig = ecc.signHash(sha256(`${identity.id}:${entity}:${block_num}:${key}`), privateKey);

// For `repute(..., block_num, sig)`
const sig = ecc.signHash(sha256(`${identity.id}:${entity}:${block_num}:${fragments.map(x => `${x.type}${x.value}`).join('')}:${tokens}`), privateKey);
```

The `block_num` must be within range of the current `head_block_num` on chain within a 10 block radius.


