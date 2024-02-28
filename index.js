const SFS2X = require("sfs2x-api-defs");



SFS2X.SFSEvent.HYPERGAMING_CONTROLLER_RESPONSE = "hypergamingControllerResponse";



SFS2X.HypergamingControllerRequest = class extends SFS2X.CustomControllerRequest {
    constructor(requestId, params) {
        super(2, requestId, params);
    }
    
    _dispatchResponse(sfs, {content, requestId}) {
        sfs.dispatchEvent(SFS2X.SFSEvent.HYPERGAMING_CONTROLLER_RESPONSE, {content, requestId});
    }

}

SFS2X.HypergamingControllerRequest.LOGIN = 0;
SFS2X.HypergamingControllerRequest.BALANCE = 1;
SFS2X.HypergamingControllerRequest.FREEROUNDS = 2;
SFS2X.HypergamingControllerRequest.FREEROUND = 3;
SFS2X.HypergamingControllerRequest.LOYALTY_RESOLVE = 4;
SFS2X.HypergamingControllerRequest.LOYALTY_CLAIM = 5;
SFS2X.HypergamingControllerRequest.LOYALTY_UPDATE = 6;
SFS2X.HypergamingControllerRequest.GAME_LIST = 7;
SFS2X.HypergamingControllerRequest.GAME_TAGS = 8;
SFS2X.HypergamingControllerRequest.CREATE_SESSION = 9;
SFS2X.HypergamingControllerRequest.JACKPOTS_CONTRIB = 10;
SFS2X.HypergamingControllerRequest.JACKPOT_WIN = 11;
SFS2X.HypergamingControllerRequest.USER_LOGIN = 12;



SFS2X.SmartFox.prototype.doControllerRequest = async function(reqId, payload = {}) {
    let self = this;
    let request = new SFS2X.HypergamingControllerRequest(reqId, SFS2X.SFSObject.fromObject(payload));
    
    this.send(request);
    return new Promise(function (resolve, reject) {

        const evtHandler = ({content, requestId}) => {
            let obj = SFS2X.SFSObject.toObject(content);
            if(reqId == requestId){
                self.removeEventListener(SFS2X.SFSEvent.HYPERGAMING_CONTROLLER_RESPONSE, evtHandler);
                resolve(obj);
            }
        }
        
        self.addEventListener(SFS2X.SFSEvent.HYPERGAMING_CONTROLLER_RESPONSE, evtHandler, this);
    })
}
SFS2X.SmartFox.prototype._connect = SFS2X.SmartFox.prototype.connect;
SFS2X.SmartFox.prototype.connect = async function(reqId, payload = {}) {
    let self = this;
    return new Promise(function (resolve, reject) {

        const onConnection = (event) => {
            try {
                if (event.success) {
                    resolve()
                }
                else {
                    reject(event.errorMessage)
                    console.warn('Connection failed: ' + (event.errorMessage ? event.errorMessage + '; (' + event.errorCode + ')' : 'Is the server running at all?'));
                }
            } finally {
                self.removeEventListener(SFS2X.SFSEvent.CONNECTION, onConnection);
            }
            
        }
        
        self.addEventListener(SFS2X.SFSEvent.CONNECTION, onConnection, this);
        self._connect();
    });
}

module.exports = SFS2X;