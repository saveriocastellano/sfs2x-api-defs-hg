const {SFS2X} = require("sfs2x-api-defs");



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
SFS2X.HypergamingControllerRequest.GAME_LIST = 6;
SFS2X.HypergamingControllerRequest.GAME_TAGS = 7;
SFS2X.HypergamingControllerRequest.CREATE_SESSION = 8;

module.exports = SFS2X;