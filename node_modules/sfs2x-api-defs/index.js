WebSocket = require('ws'); // https://www.npmjs.com/package/ws
const SFS2XAPI = require('sfs2x-api'); 
SFS2XAPI.codec = new SFS2XAPI.SmartFox({})._socketEngine._protocolCodec;
SFS2XAPI.codec._maxMessageSize = 1e6;
SFS2XAPI.ServerEvents = Object.freeze({
    UserEnterRoom: 1000,
    UserCountChange: 1001,
    UserLost: 1002,
    RoomLost: 1003,
    UserExitRoom: 1004,
    ClientDisconnection: 1005,
    ReconnectionFailure: 1006,
    SetMMOItemVariables: 1007
});


SFS2XAPI.Requests = Object.freeze({
    Handshake: 0,
    Login: 1,
    Logout: 2,
    JoinRoom: 4,
    CreateRoom: 6,
    GenericMessage: 7,
    ChangeRoomName: 8,
    ChangeRoomPassword: 9,
    SetRoomVariables: 11,
    SetUserVariables: 12,
    CallExtension: 13,
    LeaveRoom: 14,
    SubscribeRoomGroup: 15,
    UnsubscribeRoomGroup: 16,
    SpectatorToPlayer: 17,
    PlayerToSpectator: 18,
    ChangeRoomCapacity: 19,
    KickUser: 24,
    BanUser: 25,
    FindRooms: 27,
    FindUsers: 28,
    PingPong: 29,
    SetUserPosition: 30,
    QuickJoinOrCreateRoom: 31,
    InitBuddyList: 200,
    AddBuddy: 201,
    BlockBuddy: 202,
    RemoveBuddy: 203,
    SetBuddyVariables: 204,
    GoOnline: 205,
    InviteUsers: 300,
    InvitationReply: 301,
    CreateSFSGame: 302,
    QuickJoinGame: 303,
    JoinRoomInvite: 304,
    getNameFromId: function(e) {
        for (let t in this)
            if (this.hasOwnProperty(t) && this[t] === e) return t;
        return null;
    }
});

function sfsArrayToGenericArray(sfsa)
{
    var arr = [];
    _scanSFSArray(sfsa, arr);

    return arr;
}

function _scanSFSArray(sfsa, arr)
{
    for(let ii=0; ii<sfsa.size(); ii++)
    {
        var item = sfsa.getWrappedItem(ii);
        if(item.type==SFS2XAPI.SFSDataType.NULL) {
            arr.push(null);

        } else if(item.type==SFS2XAPI.SFSDataType.SFS_OBJECT) {
            arr.push(SFS2XAPI.SFSObject.toObject(item.value));

        } else if(item.type==SFS2XAPI.SFSDataType.SFS_ARRAY)
        {
            var subArr = [];
            arr.push(subArr);

            // Call recursively
            _scanSFSArray(item.value, subArr);
        } else if(item.type==SFS2XAPI.SFSDataType.CLASS) {
            continue;

         } else {
            arr.push(item.value);
         }
    }
}

function _scanSFSObject(sfso, obj) {
    var keys=sfso.keys();
    for(let key of keys)
    {
        var item = sfso.getWrappedItem(key);

        if(item.type==SFS2XAPI.SFSDataType.NULL) {
            obj[key] = null; 
        } else if(item.type==SFS2XAPI.SFSDataType.SFS_OBJECT) {
            var subObj = { };
            obj[key]=subObj;
            _scanSFSObject(item.value, subObj);
        } else if(item.type==SFS2XAPI.SFSDataType.SFS_ARRAY) {
            obj[key] = sfsArrayToGenericArray(item.value);
        } else if(item.type==SFS2XAPI.SFSDataType.CLASS){ 
            continue;
        } else { 
            obj[key] = item.value;
        }
    }
}

function _genericArrayToSFSArray(arr, forceToNumber = false){
    var sfsa = new SFS2XAPI.SFSArray();
    _scanGenericArray(arr, sfsa, forceToNumber);
    return sfsa;
}

function _scanGenericArray(arr, sfsa, forceToNumber=false) {

    for(let ii=0; ii<arr.length; ii++)
    {
        var item = arr[ii];

        if(item==null) {
            sfsa.addNull();

            // See notes for SFSObject 
        } else if(item.toString()=="[object Object]" && !Array.isArray(item)) {
            sfsa.addSFSObject(genericObjectToSFSObject(item, forceToNumber));

        } else if(Array.isArray(item))
        {
            var subSfsa = new SFS2XAPI.SFSArray();
            sfsa.addSFSArray(subSfsa);
            // Call recursively
            _scanGenericArray(item, subSfsa, forceToNumber);
        } else if(typeof(item)=='boolean') {
            sfsa.addBool(item);

        } else if(Number.isInteger(item) && !forceToNumber) {
            sfsa.addLong(item);

        } else if(!isNaN(item)) {
            sfsa.addDouble(item);

        } else if(typeof(item)=='string') {
            sfsa.addUtfString(item);
        }
    }
}

function _scanGenericObject(obj, sfso, forceToNumber)
{
    for(let key in obj)
    {
        var item = obj[key];

        if(item==null) {
            sfso.putNull(key);

            /*
         * Hack to identify a generic object without using reflection
         * ADDENDUM:	there is a special case in which the Dynamic is actually an Array with one element as Dynamic
         * 				in such case an Array is recognized as Dynamic!
         */
        } else if(item.toString()=="[object Object]" && !Array.isArray(item))
        {
            var subSfso = new SFS2XAPI.SFSObject();
            sfso.putSFSObject(key, subSfso);

            // Call recursively
            _scanGenericObject(item, subSfso, forceToNumber);
        } else if(Array.isArray(item)) {
            sfso.putSFSArray(key, _genericArrayToSFSArray(item, forceToNumber));

        } else if(typeof(item)=='boolean') {
            sfso.putBool(key, item);

        } else if(Number.isInteger(item) && !forceToNumber) {
            sfso.putLong(key, item);

        } else if(!isNaN(item) && Number.isFinite(item)) {
            sfso.putDouble(key, item);

        } else if(typeof(item)=='string') {
            sfso.putUtfString(key, item);
        }
    }
}


SFS2XAPI.SFSObject.toObject = function(sfs){ 
    let obj = {};
    _scanSFSObject(sfs, obj);
    return obj;
}

function genericObjectToSFSObject(obj, forceToNumber)
{
    var sfso = new SFS2XAPI.SFSObject();
    _scanGenericObject(obj, sfso, forceToNumber);
    return sfso;
}

SFS2XAPI.SFSObject.fromObject = genericObjectToSFSObject;

const BaseRequest = Object.getPrototypeOf(SFS2XAPI.LoginRequest);

let Events = {...SFS2XAPI.SFSEvent}
Events.CUSTOM_CONTROLLER_RESPONSE = "customControllerResponse";

SFS2XAPI.CustomControllerRequest = class extends BaseRequest {

    constructor(targetControllerId, requestId, params) {
        super(requestId);
        this._params = params;
        this._targetController = targetControllerId;
    }
    execute(sfs) {
        
        if (!sfs._controllers[this._targetController]) {
            sfs._controllers[this._targetController] = {handleMessage: (content, requestId) => { 
                this._dispatchResponse(sfs, {content, requestId});
            }};
        }

		this._reqObj = this._params;
    }

    _dispatchResponse(sfs, {content, requestId}) {       
        sfs.dispatchEvent(Events.CUSTOM_CONTROLLER_RESPONSE, {content, requestId});
    }

    validate(sfs) {

    }
}


class SFS2X {}
for (let k in SFS2XAPI) SFS2X[k] = SFS2XAPI[k];
SFS2X.SFSEvent = Events;
module.exports = SFS2X;