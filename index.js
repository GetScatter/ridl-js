const DEFAULT_CHAIN = 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906';
const DEFAULT_API = 'http://localhost:6543';

// Just a tiny sha256 fn which will work both in browsers and nodejs
// https://geraintluff.github.io/sha256/
const sha256 = function a(b){function c(a,b){return a>>>b|a<<32-b}for(var d,e,f=Math.pow,g=f(2,32),h="length",i="",j=[],k=8*b[h],l=a.h=a.h||[],m=a.k=a.k||[],n=m[h],o={},p=2;64>n;p++)if(!o[p]){for(d=0;313>d;d+=p)o[d]=p;l[n]=f(p,.5)*g|0,m[n++]=f(p,1/3)*g|0}for(b+="\x80";b[h]%64-56;)b+="\x00";for(d=0;d<b[h];d++){if(e=b.charCodeAt(d),e>>8)return;j[d>>2]|=e<<(3-d)%4*8}for(j[j[h]]=k/g|0,j[j[h]]=k,e=0;e<j[h];){var q=j.slice(e,e+=16),r=l;for(l=l.slice(0,8),d=0;64>d;d++){var s=q[d-15],t=q[d-2],u=l[0],v=l[4],w=l[7]+(c(v,6)^c(v,11)^c(v,25))+(v&l[5]^~v&l[6])+m[d]+(q[d]=16>d?q[d]:q[d-16]+(c(s,7)^c(s,18)^s>>>3)+q[d-7]+(c(t,17)^c(t,19)^t>>>10)|0),x=(c(u,2)^c(u,13)^c(u,22))+(u&l[1]^u&l[2]^l[1]&l[2]);l=[w+x|0].concat(l),l[4]=l[4]+w|0}for(d=0;8>d;d++)l[d]=l[d]+r[d]|0}for(d=0;8>d;d++)for(e=3;e+1;e--){var y=l[d]>>8*e&255;i+=(16>y?0:"")+y.toString(16)}return i};


const GET_GEN = host => (route) => fetch(`${host}/v1/${route}`).then(x => x.json()).catch(() => ({error:'Could not contact API host.'}));
const POST_GEN = host => (route, data) => fetch(`${host}/v1/${route}`, { method:"POST", headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, body:JSON.stringify(data) }).then(x => x.json()).catch(() => ({error:'Could not contact API host.'}));


const RIDL = (signer = null, api_host = DEFAULT_API, _chain = DEFAULT_CHAIN) => {
	const GET = GET_GEN(api_host);
	const POST = POST_GEN(api_host);
	const getBlockNum = chain => GET(`/block_num/${chain}`);

	return {
		/*** Gets a list of the currently used chains for RIDL */
		async chains(){
			return GET(`chains`);
		},

		/*** Gets a list of the currently used hosts for a chain */
		async hosts(chain){
			return GET(`hosts/${chain}`);
		},

		/*** Suggest a node/host to be added for a chain
		 * @param chain_id
		 * @param host
		 * @param options
		 * @returns {*}
		 *
		 * options is only used for NEW chains.
		 example: {
		    logic_contract:'ridlridlridl',
			token_contract:'ridlridltkns',
			sender_account:'ridlridlsend,
			creator_account:'ridlridluser',
		 }
		 */
		async addHost(chain_id, host, options = {}){
			return POST(`hosts`, {chain_id, host, options});
		},

		/*** Finds an identity by username.
		 * @param username - A username to look for
		 * @returns {*}
		 */
		async findIdentity(username){
			return GET(`identity/${username}`);
		},

		/*** Finds a reputation by entity.
		 * @param entity - An entity to look for
		 * @returns {*}
		 */
		async findReputation(entity){
			return GET(`reputation/${entity}`);
		},

		/*** Registers a new identity
		 * @param username - The username to register
		 * @param key - The key to link to this identity
		 * @param chain - The chain this is being sent to.
		 * @returns {*}
		 */
		async identify(username, key, chain = _chain){
			return POST(`send/identify`, {chain, username, key});
		},

		/*** Changes an identity's registered public key
		 * @param identity_id - The ID of the identity
		 * @param key - The new key to change to
		 * @param block_num - The current block num
		 * @param sig - A signature using the identity's old private key of sha256(`identity_id:block_num:new_public_key`)
		 * @param chain - The chain this is being sent to.
		 * @returns {*}
		 */
		async changekey(identity_id, key, block_num = null, sig = null, chain = _chain){
			if(block_num === null) {
				block_num = await getBlockNum(chain);
				if(!block_num) return {error:'Could not get block num from server.'};
				sig = signer(sha256(`${identity_id}:${entity}:${block_num}:${key}`));
			}
			return POST(`send/changekey`, {chain, identity_id, key, block_num, sig});
		},

		/*** Adds a reputation for an `entity`
		 * @param identity_id - The ID of the identity reputing
		 * @param entity - And entity which is getting reputed
		 * @param fragments - An array of [{type:'security', value:-1}, {type:'solvency', value:1}]
		 * @param tokens - A string of tokens (1.0000 RIDL). Must be at least 1 RIDL per fragment.
		 * @param details (optional) - Details about this repute
		 * @param block_num (optional) - The current block num
		 * @param sig (optional) - A signature using the identity's private key of sha256(`identity_id:entity::block_num:fragments.map(x => `${x.type}${x.value}`):tokens`)
		 * @param chain - The chain this is being sent to.
		 * @returns {*}
		 */
		async repute(identity_id, entity, fragments, tokens, details = '', block_num = null, sig = null, chain = _chain){
			if(block_num === null) {
				block_num = await getBlockNum(chain);
				if(!block_num) return {error:'Could not get block num from server.'};
				sig = signer(sha256(`${identity_id}:${entity}:${block_num}:${fragments.map(x => `${x.type}${x.value}`).join('')}:${tokens}`));
			}
			return POST(`send/repute`, {chain, identity_id, entity, fragments, tokens, block_num, sig, details});
		},
	}
};



if(typeof window !== 'undefined') window.RIDL = RIDL;
else module.exports = RIDL;