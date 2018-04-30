var webs = null;
var QueryString = function () {
    var query_string = {};
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (typeof query_string[pair[0]] === "undefined") {
            query_string[pair[0]] = decodeURIComponent(pair[1])
        } else if (typeof query_string[pair[0]] === "string") {
            var arr = [query_string[pair[0]], decodeURIComponent(pair[1])];
            query_string[pair[0]] = arr
        } else {
            query_string[pair[0]].push(decodeURIComponent(pair[1]))
        }
    }
    return query_string
}();

var host_port = QueryString.HOST_PORT;
if (host_port==undefined)
    host_port="127.0.0.1:10501"
while (host_port.endsWith('/')) {
    host_port = host_port.substring(0, host_port.length - 1)
}
if (wsUri.indexOf("//") == 0) {
    wsUri = wsUri.substring(2)
}
if (wsUri.indexOf("ws://") == 0 || wsUri.indexOf("wss://") == 0) {
    if (host_port.indexOf("ws://") == 0 || host_port.indexOf("wss://") == 0) {
        wsUri = wsUri.replace(/ws:\/\/@HOST_PORT@/im, host_port);
        wsUri = wsUri.replace(/wss:\/\/@HOST_PORT@/im, host_port)
    } else {
        wsUri = wsUri.replace(/@HOST_PORT@/im, host_port)
    }
} else {
    if (host_port.indexOf("ws://") == 0 || host_port.indexOf("wss://") == 0) {
        wsUri = wsUri.replace(/@HOST_PORT@/im, host_port)
    } else {
        wsUri = "ws://" + wsUri.replace(/@HOST_PORT@/im, host_port)
    }
}

class ActWebsocketInterface {
    constructor(uri, path = "MiniParse") {
        var querySet = this.getQuerySet();
        this.uri = uri;
        this.id = null;
        this.activate = !1;
        var This = this;
        document.addEventListener('onBroadcastMessage', function (evt) {
            This.onBroadcastMessage(evt)
        });
        document.addEventListener('onRecvMessage', function (evt) {
            This.onRecvMessage(evt)
        });
        window.addEventListener('message', function (e) {
            if (e.data.type === 'onBroadcastMessage') {
                This.onBroadcastMessage(e.data)
            }
            if (e.data.type === 'onRecvMessage') {
                This.onRecvMessage(e.data)
            }
        })
    }
    connect() {
        if (typeof this.websocket != "undefined" && this.websocket != null)
            this.close();
        this.activate = !0;
        var This = this;
        this.websocket = new WebSocket(this.uri);
        this.websocket.onopen = function (evt) {
            This.onopen(evt)
        };
        this.websocket.onmessage = function (evt) {
            This.onmessage(evt)
        };
        this.websocket.onclose = function (evt) {
            This.onclose(evt)
        };
        this.websocket.onerror = function (evt) {
            This.onerror(evt)
        }
    }
    close() {
        this.activate = !1;
        if (this.websocket != null && typeof this.websocket != "undefined") {
            this.websocket.close()
        }
    }
    onopen(evt) {
        if (this.id != null && typeof this.id != "undefined") {
            this.set_id(this.id)
        } else {
            if (typeof overlayWindowId != "undefined") {
                this.set_id(overlayWindowId)
            } else {
                var r = new RegExp('[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}');
                var id = r.exec(navigator.userAgent);
                if (id != null && id.length == 1) {
                    this.set_id(id[0])
                }
            }
        }
    }
    onclose(evt) {
        this.websocket = null;
        if (this.activate) {
            var This = this;
            setTimeout(function () {
                This.connect()
            }, 5000)
        }
    }
    onmessage(evt) {
        if (evt.data == ".") {
            this.websocket.send(".")
        } else {
            try {
                var obj = JSON.parse(evt.data);
                var type = obj.type;
                if (type == "broadcast") {
                    var from = obj.from;
                    var type = obj.msgtype;
                    var msg = obj.msg;
                    document.dispatchEvent(new CustomEvent('onBroadcastMessage', {
                        detail: obj
                    }))
                }
                if (type == "send") {
                    var from = obj.from;
                    var type = obj.msgtype;
                    var msg = obj.msg;
                    document.dispatchEvent(new CustomEvent('onRecvMessage', {
                        detail: obj
                    }))
                }
                if (type == "set_id") { }
            } catch (e) { }
        }
    }
    onerror(evt) {
        this.websocket.close();
        console.log(evt)
    }
    getQuerySet() {
        var querySet = {};
        var query = window.location.search.substring(1);
        var vars = query.split('&');
        for (var i = 0; i < vars.length; i++) {
            try {
                var pair = vars[i].split('=');
                querieSet[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1])
            } catch (e) { }
        }
        return querySet
    }
    broadcast(type, msg) {
        if (typeof overlayWindowId != 'undefined' && this.id != overlayWindowId) {
            this.set_id(overlayWindowId)
        }
        var obj = {};
        obj.type = "broadcast";
        obj.msgtype = type;
        obj.msg = msg;
        this.websocket.send(JSON.stringify(obj))
    }
    send(to, type, msg) {
        if (typeof overlayWindowId != 'undefined' && this.id != overlayWindowId) {
            this.set_id(overlayWindowId)
        }
        var obj = {};
        obj.type = "send";
        obj.to = to;
        obj.msgtype = type;
        obj.msg = msg;
        this.websocket.send(JSON.stringify(obj))
    }
    overlayAPI(type, msg) {
        var obj = {};
        if (typeof overlayWindowId != 'undefined' && this.id != overlayWindowId) {
            this.set_id(overlayWindowId)
        }
        obj.type = "overlayAPI";
        obj.to = overlayWindowId;
        obj.msgtype = type;
        obj.msg = msg;
        this.websocket.send(JSON.stringify(obj))
    }
    set_id(id) {
        var obj = {};
        obj.type = "set_id";
        obj.id = id;
        this.id = overlayWindowId;
        this.websocket.send(JSON.stringify(obj))
    }
    onRecvMessage(e) { }
    onBroadcastMessage(e) { }
};
class WebSocketImpl extends ActWebsocketInterface {
    constructor(uri, path = "MiniParse") {
        super(uri, path)
    }
    onRecvMessage(e) {
        onRecvMessage(e)
    }
    onBroadcastMessage(e) {
        onBroadcastMessage(e)
    }
};
String.prototype.format = function (a) {
    var reg = /(\{([^}]+)\})/im;
    var matches = this.match(reg);
    var result = this;
    for (var i in a)
        result = result.replace("{" + i + "}", a[i]);
    return result
};
String.prototype.contains = function (a) {
    if (this.indexOf(a) > -1) return !0;
    else return !1
};
String.prototype.replaceArray = function (a) {
    var r = this;
    for (var i in a)
        while (r.contains(a[i].target))
            r = r.replace(a[i].target, a[i].replacement);
    return r
};
Number.prototype.nanFix = function () {
    return parseFloat(isNaN(this) ? 0 : this)
};
Number.prototype.numFormat = new function () {
    var str = "";
    var data = 0;
    try {
        if (data != Infinity && data != 0 && data != NaN) {
            var reg = /(^[+-]?\d+)(\d{3})/;
            var n = (this + "");
            while (reg.test(n)) n = n.replace(reg, "$1,$2");
            return n
        } else return "0"
    } catch (ex) {
        return "0"
    }
};
if (document.addEventListener) {
    document.addEventListener("DOMContentLoaded", function () {
        document.removeEventListener("DOMContentLoaded", arguments.callee, !1);
        domReady()
    }, !1);
    window.onbeforeunload = function () {
        webs.close()
    };
    window.addEventListener("unload", function () {
        webs.close()
    }, !1)
} else if (document.attachEvent) {
    document.attachEvent("onreadystatechange", function () {
        if (document.readyState === "complete") {
            document.detachEvent("onreadystatechange", arguments.callee);
            domReady()
        }
    })
}
window.addEventListener('message', function (e) {
    if (e.data.type === 'onBroadcastMessage') {
        onBroadcastMessage(e.data)
    }
    if (e.data.type === 'onRecvMessage') {
        onRecvMessage(e.data)
    }
});

function domReady() {
    try {
        webs = new WebSocketImpl(wsUri);
        webs.connect();
        console.log("Connecting...")
    } catch (ex) {
        console.log("[ERROR] : WebSocket has Error [] " + ex)
    }
    try {
        document.addEventListener('beforeLogLineRead', beforeLogLineRead)
    } catch (ex) { }
    try {
        document.addEventListener('onLogLineRead', onLogLineRead)
    } catch (ex) { }
    try {
        document.addEventListener('onOverlayDataUpdate', onOverlayDataUpdate)
    } catch (ex) {
        console.log("Core Error : onOverlayDataUpdate is not defined.")
    }
    try {
        document.addEventListener('onOverlayStateUpdate', onOverlayStateUpdate)
    } catch (ex) { }
    try {
        onDocumentLoad()
    } catch (ex) { }
}

function onRecvMessage(e) {
    if (e.detail.msgtype == "Chat") {
        document.dispatchEvent(new CustomEvent("onChatting", {
            detail: e.detail.msg
        }))
    } else {
        console.log(e.detail.msgtype + ":" + e.detail.msg)
    }
}

function onBroadcastMessage(e) {
    if (e.detail.msgtype == "CombatData") {
        lastCombatRaw = e.detail.msg;
        lastCombat = new Combatant({
            detail: lastCombatRaw
        }, sortKey);
        if (lastCombat.Combatant.YOU != undefined && myName != "" && myName != undefined && myName != null) {
            lastCombat.Combatant.YOU.displayName = myName
        }
        document.dispatchEvent(new CustomEvent('onOverlayDataUpdate', {
            detail: lastCombatRaw
        }))
    } else {
        switch (e.detail.msgtype) {
            case "SendCharName":
                document.dispatchEvent(new CustomEvent("onCharacterNameRecive", {
                    detail: e.detail.msg
                }));
                myName = e.detail.msg.charName;
                break;
            case "AddCombatant":
                break;
            case "RemoveCombatant":
                break;
            case "AbilityUse":
                break;
            case "Chat":
                document.dispatchEvent(new CustomEvent("onChatting", {
                    detail: e.detail.msg
                }));
                break;
            default:
                console.log(e.detail.msgtype + ":" + e.detail.msg);
                break
        }
    }
}

//自动进万
function toWan(num){
    var str;
    if(!isNaN(num))
    {
        if(parseInt(num)<10000){
            str=num;
         }
        else{
      //   str= (parseInt(num))/10000+"万";
      str= ((parseInt(num))/10000).toFixed(1)+"万";
        }
    }
        return str;
}

function Person(e, p) {
    this.parent = p;
    this.Class = "";
    for (var i in e) {
        if (i.indexOf("NAME") > -1) continue;
        if (i == "t" || i == "n") continue;
        var onlyDec = e[i].replace(/[0-9.,%]+/ig, "");
        if (onlyDec != "") {
            if (onlyDec == "---" || onlyDec == "--")
                this[i] = 0;
            else this[i] = e[i]
        } else {
            var tmp = parseFloat(e[i].replace(/[,%]+/ig, "")).nanFix().toFixed(underDot);
            if (e[i].indexOf("%") > 0)
                this[i] = parseFloat(tmp);
            else if (Math.floor(tmp) != tmp || e[i].indexOf(".") > 0)
                this[i] = parseFloat(tmp);
            else
                this[i] = parseInt(tmp).nanFix()
        }
    }
    if (this.DURATION <= 0) {
        this.dps = parseFloat((this.damage / this.parent.DURATION).nanFix().toFixed(underDot));
        this.hps = parseFloat((this.healed / this.parent.DURATION).nanFix().toFixed(underDot));
        this.DPS = Math.floor(this.dps);
        this.HPS = Math.floor(this.hps);
        this["DPS-k"] = Math.floor(this.dps / 1000);
        this["HPS-k"] = Math.floor(this.hps / 1000);
        for (var i in this) {
            if (this[i] == "∞")
                this[i] = 0
        }
    }
    if (this.Job != "")
        this.Class = this.Job.toUpperCase();
    this.petOwner = "";
    this.petType = "Chocobo";
    this.isPet = !1;
    this.role = "DPS";
    this.rank = 0;
    this.maxdamage = 0;
    this.displayName = this.name;
    this.isLower = !1;
    var vjob = this.Job;
    if (vjob != "") vjob = this.Job.toUpperCase();
    switch (vjob) {
        case "GLD":
        case "GLA":
            this.Class = "PLD";
            this.isLower = !0;
            break;
        case "MRD":
            this.Class = "WAR";
            this.isLower = !0;
            break;
        case "PUG":
            this.Class = "MNK";
            this.isLower = !0;
            break;
        case "LNC":
            this.Class = "DRG";
            this.isLower = !0;
            break;
        case "ROG":
            this.Class = "NIN";
            this.isLower = !0;
            break;
        case "ARC":
            this.Class = "BRD";
            this.isLower = !0;
            break;
        case "THM":
            this.Class = "BLM";
            this.isLower = !0;
            break;
        case "ACN":
            this.Class = "SMN";
            this.isLower = !0;
            break;
        case "CNJ":
            this.Class = "WHM";
            this.isLower = !0;
            break
    }
    if (this.Class != "") {
        switch (this.Class) {
            case "SCH":
            case "WHM":
            case "AST":
                this.role = "Healer";
                break;
            case "PLD":
            case "WAR":
            case "DRK":
                this.role = "Tanker";
                break
        }
    }
    if (this.Class == "") {
        if (this.name.indexOf("之灵") > -1 ||this.name.indexOf("에기") > -1 || this.name.indexOf("카벙클") > -1 || this.name.indexOf("데미바하무트") > -1 || this.name.toUpperCase().indexOf("EGI") > -1 || this.name.toUpperCase().indexOf("DEMI-BAHAMUT") > -1 || this.name.toUpperCase().indexOf("CARBUNCLE") > -1 || this.name.indexOf("Karfunkel") > -1 || this.name.indexOf("エギ") > -1 || this.name.indexOf("カーバンクル") > -1 || this.name.indexOf("石兽") > -1 || this.name.indexOf("亚灵神巴哈姆特") > -1) {
            this.Job = "AVA";
            this.Class = "SMN";
            this.isPet = true;
            this.petType = "Egi"
        }
        if (this.name.indexOf("요정") > -1 || this.name.toUpperCase().indexOf("EOS") > -1 || this.name.toUpperCase().indexOf("SELENE") > -1 || this.name.indexOf("フェアリー") > -1 || this.name.indexOf("小仙女") > -1) {
            this.Job = "AVA";
            this.Class = "SCH";
            this.isPet = true;
            this.role = "Healer";
            this.petType = "Fairy"
        }
        if (this.name.indexOf("자동포탑") > -1 || this.name.toUpperCase().indexOf("AUTOTURRET") > -1 || this.name.indexOf("オートタレット") > -1 || this.name.indexOf("Selbstschuss-Gyrocopter") > -1 || this.name.toLowerCase().indexOf("auto-tourelle") > -1 || this.name.indexOf("式浮空炮塔") > -1) {
            this.Job = "AVA";
            this.Class = "MCH";
            this.isPet = true;
            this.petType = "AutoTurret"
        }
        if (this.name.toUpperCase().indexOf("LIMIT BREAK") > -1 || this.name.indexOf("リミット") > -1|| this.name.indexOf("极限技") > -1) {
            this.Job = "LMB";
            this.Class = "LMB"
        }
    }
    try {
        this.maxhitstr = forTest(this.maxhit.split('-')[0]);
        this.maxhitval = parseInt(this.maxhit.split('-')[1].replace(/\D/g, ""))
        if(this.maxhitstr == "Unknown" && this.Class == "MCH" && localStorage.getItem("lang") == "kr")     
            this.maxhitstr = "野火"
    } catch (ex) {
        this.maxhit = "?-0";
        this.maxhitstr = "";
        this.maxhitval = 0
    }
    try {
        this.maxhealstr = this.maxheal.split('-')[0];
        this.maxhealval = parseInt(this.maxheal.split('-')[1].replace(/\D/g, ""))
    } catch (ex) {
        this.maxheal = "?-0";
        this.maxhealstr = "";
        this.maxhealval = 0
    }
    this.visible = !0;
    this.original = {
        Damage: this.damage,
        Hits: this.hits,
        Misses: this.misses,
        Swings: this.swings,
        Crithits: this.crithits,
        DirectHitCount: this.DirectHitCount,
        CritDirectHitCount: this.CritDirectHitCount,
        Damagetaken: this.damagetaken,
        Heals: this.heals,
        Healed: this.healed,
        Critheals: this.critheals,
        Healstaken: this.healstaken,
        DamageShield: this.damageShield,
        OverHeal: this.overHeal,
        AbsorbHeal: this.absorbHeal,
        Last10DPS: this.Last10DPS,
        Last30DPS: this.Last30DPS,
        Last60DPS: this.Last60DPS,
        Last180DPS: this.Last180DPS,
    };
    try {
        var regex = /(?:.*?)\((.*?)\)/im;
        var matches = this.name.match(regex);
        if (regex.test(this.name)) // do not use Array.length 
        {
            if(this.Job == "0" || this.Job == "AVA")
                this.petOwner = matches[1];
        }
    }
    catch (ex) {

    }
    if (this.petOwner != "" && this.Job == "0") {
        this.Job = "CBO";
        this.Class = "CBO";
        this.petType = "Chocobo_Persons";
    }
    if (this.overHeal != undefined) { }
    this.color = {
        R: this.getColor().R,
        G: this.getColor().G,
        B: this.getColor().B
    }
    if (this.petType != "Chocobo") {
        this.color.R += parseInt(this.color.R / 3);
        this.color.G += parseInt(this.color.G / 3);
        this.color.B += parseInt(this.color.B / 3)
    }
    for (var i in this.original) {
        if (i.indexOf("Last") > -1)
            this["merged" + i] = this[i];
        else if (i == "CritDirectHitCount" || i == "DirectHitCount")	//신규추가 4.0 
            this["merged" + i] = this[i];
        else this["merged" + i] = this[i.substr(0, 1).toLowerCase() + i.substr(1)]
    }
    this.pets = {}
}
Person.prototype.returnOrigin = function () {
    for (var i in this.original) {
        if (i.indexOf("Last") > -1)
            this["merged" + i] = this[i];
        else if (i == "CritDirectHitCount" || i == "DirectHitCount")	//신규추가 4.0 
            this["merged" + i] = this[i];
        else this["merged" + i] = this[i.substr(0, 1).toLowerCase() + i.substr(1)]
    }
};
Person.prototype.merge = function (person) {
    this.returnOrigin();
    this.pets[person.name] = person;
    for (var k in this.pets) {
        for (var i in this.original) {
            if (i.indexOf("Last") > -1)
                this["merged" + i] += this.pets[k].original[i];
            else this["merged" + i] += this.pets[k].original[i]
        }
    }
    this.recalculate()
};
Person.prototype.recalc = function () {
    this.recalculate()
};
Person.prototype.recalculate = function () {
    var dur = this.DURATION;
    if (dur == 0) dur = 1;
    this.dps = pFloat(this.mergedDamage / dur);
    this.encdps = pFloat(this.mergedDamage / this.parent.DURATION);
    this.hps = pFloat(this.mergedHealed / dur);
    this.enchps = pFloat(this.mergedHealed / this.parent.DURATION);
  //  this["damage"]=this["DAMAGE-k"];
    
   // this["DAMAGE-k"] =toWan(this.mergedDamage);测试2
  //  this["DAMAGE-k"] =Math.floor(this.mergedDamage / 10000);
    this["DAMAGE-k"] =toWan(this.mergedDamage);
    this["DAMAGE-m"] = Math.floor(this.mergedDamage / 1000000);
    this.DPS = Math.floor(this.dps);
    this["DPS-k"] = Math.floor(this.dps / 1000);
    this.ENCDPS = Math.floor(this.encdps);
    this.ENCHPS = Math.floor(this.enchps);
    this["ENCDPS-k"] = Math.floor(this.encdps / 1000);
    this["ENCHPS-k"] = Math.floor(this.enchps / 1000);
    this["damage%"] = pFloat(this.mergedDamage / this.parent.Encounter.damage * 100);
    this["healed%"] = pFloat(this.mergedHealed / this.parent.Encounter.healed * 100);
    this["crithit%"] = pFloat(this.mergedCritHits / this.mergedHits * 100);
    this["DirectHit%"] = pFloat(this.mergedDirectHitCount / this.mergedHits * 100);
    this["CritDirectHit%"] = pFloat(this.mergedCritDirectHitCount / this.mergedHits * 100);
    this["critheal%"] = pFloat(this.mergedCritHeals / this.mergedheals * 100);
   // this.tohit = Math.floor(this.mergedDamage / 1000);
   this.tohit = pFloat(this.mergedHits / this.mergedSwings * 100)
 //  this["tohit"] = Math.floor(this.mergedDamage / 1000)
};
Person.prototype.getColor = function (r, g, b) {
    if (jobColors[this.Class] != undefined) {
        if (r == undefined) var r = 0;
        if (g == undefined) var g = 0;
        if (b == undefined) var b = 0;
        return {
            "R": (jobColors[this.Class][0] + r),
            "G": (jobColors[this.Class][1] + g),
            "B": (jobColors[this.Class][2] + b)
        }
    } else {
        return {
            "R": 240,
            "G": 220,
            "B": 110
        }
    }
};
Person.prototype.get = function (key) {
    if (this.parent.summonerMerge) {
        switch (key) {
            case "damage":
                key = "mergedDamage";
                break;
            case "hits":
                key = "mergedHits";
                break;
            case "misses":
                key = "mergedMisses";
                break;
            case "swings":
                key = "mergedSwings";
                break;
            case "crithits":
                key = "mergedCritHits";
                break;
            case "DirectHitCount":
                key = "mergedDirectHitCount";
                break;
            case "CritDirectHitCount":
                key = "mergedCritDirectHitCount";
                break;
            case "damagetaken":
                key = "mergedDamagetaken";
                break;
            case "heals":
                key = "mergedHeals";
                break;
            case "healed":
                key = "mergedHealed";
                break;
            case "critheals":
                key = "mergedCritHeals";
                break;
            case "healstaken":
                key = "mergedHealstaken";
                break;
            case "damageShield":
                key = "mergedDamageShield";
                break;
            case "overHeal":
                key = "mergedOverHeal";
                break;
            case "absorbHeal":
                key = "mergedAbsorbHeal";
                break;
            case "Last10DPS":
                key = "mergedLast10DPS";
                break;
            case "Last30DPS":
                key = "mergedLast30DPS";
                break;
            case "Last60DPS":
                key = "mergedLast60DPS";
                break;
            case "Last180DPS":
                key = "mergedLast180DPS";
                break
        }
    }
    return this[key]
}

function Combatant(e, sortkey) {

    if (sortkey == undefined) var sortkey = "encdps";
    if (lang == undefined) var lang = "ko";
    this.Encounter = {};
    this.Combatant = {};
    this.users = {};
    for (var i in e.detail.Combatant) {
        this.users[i] = !0
    }
    for (var i in e.detail.Encounter) {
        if (i == "t" || i == "n") continue;
        var onlyDec = e.detail.Encounter[i].replace(/[0-9.,%]+/ig, "");
        if (onlyDec != "") {
            if (onlyDec == "---" || onlyDec == "--")
                this.Encounter[i] = 0;
            else this.Encounter[i] = e.detail.Encounter[i]
        } else {
            var tmp = parseFloat(e.detail.Encounter[i].replace(/[,%]+/ig, "")).nanFix().toFixed(underDot);
            if (e.detail.Encounter[i].indexOf("%") > 0)
                this.Encounter[i] = parseFloat(tmp);
            else if(Math.floor(tmp) != tmp || e.detail.Encounter[i].indexOf(".") > 0)
                this.Encounter[i] = parseFloat(tmp);
            else this.Encounter[i] = parseInt(tmp).nanFix()
        }
    }
    for (var i in e.detail.Combatant) {
        this.Combatant[i] = new Person(e.detail.Combatant[i], this)
    }
    for (var i in e.detail.Combatant) {
        this.Combatant[i].parent = this
    }
    var tmp = {};
    for (var i in this.Combatant) {
        if (this.Combatant[i].Class != "") {
            tmp[i] = this.Combatant[i]
        }
    }
    this.Combatant = tmp;
    this.maxdamage = 0;
    this.maxValue = 0;
    this.zone = this.Encounter.CurrentZoneName;
    this.title = this.Encounter.title;
    this.sortvector = !0;
    this.duration = this.Encounter.duration;
    this.DURATION = this.Encounter.DURATION;
    this.summonerMerge = !0;
    this.sortkey = sortkey;
    this.langpack = new Language(lang);
    this.isActive = e.detail.isActive;
    this.combatKey = this.Encounter.title.concat(this.Encounter.damage).concat(this.Encounter.healed);
    this.persons = this.Combatant;
    this.resort()
}
Combatant.prototype.rerank = function (vector) {
    this.sort(vector)
};
Combatant.prototype.indexOf = function (person) {
    var v = -1;
    for (var i in this.Combatant) {
        v++;
        if (i == person)
            return v
    }
    return v
};
Combatant.prototype.sort = function (vector) {
    if (vector != undefined)
        this.sortvector = vector;
    if (this.summonerMerge) {
        switch (this.sortkey) {
            case "damage":
                this.sortkey = "mergedDamage";
                break;
            case "hits":
                this.sortkey = "mergedHits";
                break;
            case "misses":
                this.sortkey = "mergedMisses";
                break;
            case "swings":
                this.sortkey = "mergedSwings";
                break;
            case "crithits":
                this.sortkey = "mergedCritHits";
                break;
            case "DirectHitCount":
                this.sortkey = "mergedDirectHitCount";
                break;
            case "CritDirectHitCount":
                this.sortkey = "mergedCritDirectHitCount";
                break;
            case "damagetaken":
                this.sortkey = "mergedDamagetaken";
                break;
            case "heals":
                this.sortkey = "mergedHeals";
                break;
            case "healed":
                this.sortkey = "mergedHealed";
                break;
            case "critheals":
                this.sortkey = "mergedCritHeals";
                break;
            case "healstaken":
                this.sortkey = "mergedHealstaken";
                break;
            case "damageShield":
                this.sortkey = "mergedDamageShield";
                break;
            case "overHeal":
                this.sortkey = "mergedOverHeal";
                break;
            case "absorbHeal":
                this.sortkey = "mergedAbsorbHeal";
                break;
            case "Last10DPS":
                this.sortkey = "mergedLast10DPS";
                break;
            case "Last30DPS":
                this.sortkey = "mergedLast30DPS";
                break;
            case "Last60DPS":
                this.sortkey = "mergedLast60DPS";
                break;
            case "Last180DPS":
                this.sortkey = "mergedLast180DPS";
                break
        }
    }

    var tmpOwner = [];
    var tmpUser = [];

    for (var i in this.Combatant) {
        if (this.Combatant[i].petOwner == "") {
            tmpUser.push(this.Combatant[i].name);
        } else {
            tmpOwner.push(this.Combatant[i].petOwner);
        }
    }
    for (var i in tmpUser) {
        for (var j in tmpOwner) {
            if (tmpUser[i] == tmpOwner[j]){   
                delete tmpOwner[j];
            }
        }
    }
    tmpMyName = ""; 
    for(var i = 0 ; i<tmpOwner.length; i++){
        if(tmpOwner[i] != undefined){
            tmpMyName = tmpOwner[i];
        }
    }
    for (var i in this.Combatant) {
        if (this.Combatant[i].isPet && this.summonerMerge) {
            if (this.Combatant["YOU"] != undefined) {                
                if (tmpMyName == this.Combatant[i].petOwner)
                    this.Combatant["YOU"].merge(this.Combatant[i]);
            }
            if (this.Combatant[this.Combatant[i].petOwner] != undefined) {
                this.Combatant[this.Combatant[i].petOwner].merge(this.Combatant[i]);
            }
            this.Combatant[i].visible = !1
        } else {
            this.Combatant[i].visible = !0
        }
    }
    var tmp = [];
    var r = 0;
    for (var i in this.Combatant) {
        tmp.push({
            key: this.Combatant[i][this.sortkey],
            val: this.Combatant[i]
        });
    }
    this.Combatant = {};
    if (this.sortvector)
        tmp.sort(function (a, b) {
            return b.key - a.key
        });
    else tmp.sort(function (a, b) {
        return a.key - b.key
    });
    var tmpMax = 0;
    for (var i in tmp) {
        if (this.summonerMerge == true) {
            if (tmp[i].val.Job != "AVA") { 
                if (tmpMax < tmp[i].val[this.sortkey])
                    tmpMax = tmp[i].val[this.sortkey];
            }
        } else {
            if (tmpMax < tmp[i].val[this.sortkey])
                tmpMax = tmp[i].val[this.sortkey];
        }
    }
    this.maxdamage = tmpMax;
    this.maxValue = tmpMax;

    for (var i in tmp) {
        this.Combatant[tmp[i].val.name] = tmp[i].val
    }
    for (var i in this.Combatant) {
        if (!this.Combatant[i].visible) continue;
        this.Combatant[i].rank = r++;
        this.Combatant[i].maxdamage = this.maxdamage
    }
    this.persons = this.Combatant
};
Combatant.prototype.changeLang = function (lang) {
    this.langpack = new Language(lang);
    document.dispatchEvent(new CustomEvent('onLanguageChange', {
        detail: {
            language: lang,
            combatant: this
        }
    }))
};
Combatant.prototype.AttachPets = function () {
    this.summonerMerge = !0;
    for (var i in this.Combatant) {
        this.Combatant[i].returnOrigin();
        this.Combatant[i].recalculate();
        this.Combatant[i].parent = this
    }
}
Combatant.prototype.DetachPets = function () {
    this.summonerMerge = !1;
    for (var i in this.Combatant) {
        this.Combatant[i].returnOrigin();
        this.Combatant[i].recalculate();
        this.Combatant[i].parent = this
    }
}
Combatant.prototype.sortkeyChange = function (key) {
    this.resort(key, !0)
};
Combatant.prototype.sortkeyChangeDesc = function (key) {
    this.resort(key, !1)
};
Combatant.prototype.resort = function (key, vector) {
    if (key == undefined)
        this.sortkey = activeSort(this.sortkey);
    else this.sortkey = activeSort(key);
    if (vector == undefined)
        vector = this.sortvector;
    this.sort(vector)
};

function Language(l) {
    if (l == undefined) var l = "ko";
    this.lang = l;
    this.jp = {
        "PLD": "ナイト",
        "GLD": "剣術士",
        "WAR": "戦",
        "MRD": "斧術士",
        "DRK": "暗",
        "MNK": "モンク",
        "PGL": "格闘士",
        "DRG": "竜",
        "LNC": "槍術士",
        "NIN": "忍",
        "ROG": "双剣士",
        "BRD": "吟",
        "ARC": "弓術士",
        "MCH": "機",
        "SMN": "召",
        "THM": "呪術士",
        "BLM": "黒",
        "WHM": "白",
        "CNJ": "幻術士",
        "SCH": "学",
        "ACN": "巴術士",
        "AST": "占",
        "LMB": "リミット",
        "FAIRY": "FAIRY",
        "AUTOTURRET": "AUTOTURRET",
        "EGI": "EGI",
        "CHOCOBO": "CHOCOBO",
    };
    this.en = {
        "PLD": "PLD",
        "GLD": "GLD",
        "WAR": "WAR",
        "MRD": "MRD",
        "DRK": "DRK",
        "MNK": "MNK",
        "PGL": "PGL",
        "DRG": "DRG",
        "LNC": "LNC",
        "NIN": "NIN",
        "ROG": "ROG",
        "BRD": "BRD",
        "ARC": "ARC",
        "MCH": "MCH",
        "SMN": "SMN",
        "THM": "THM",
        "BLM": "BLM",
        "WHM": "WHM",
        "CNJ": "CNJ",
        "SCH": "SCH",
        "ACN": "ACN",
        "AST": "AST",
        "LMB": "LMB",
        "FAIRY": "FAIRY",
        "AUTOTURRET": "AUTOTURRET",
        "EGI": "EGI",
        "CHOCOBO": "CHOCOBO",
    };
    this.ko = {
        "PLD": "骑士",
        "GLD": "剑术师",
        "WAR": "战士",
        "MRD": "斧术师",
        "DRK": "暗黑骑士",
        "MNK": "武僧",
        "PGL": "格斗家",
        "DRG": "龙骑士",
        "LNC": "枪术师",
        "NIN": "忍者",
        "ROG": "双剑师",
        "BRD": "吟游诗人",
        "ARC": "弓箭手",
        "MCH": "机工士",
        "SMN": "召唤师",
        "THM": "咒术师",
        "BLM": "黑魔法师",
        "WHM": "白魔法师",
        "CNJ": "幻术师",
        "SCH": "学者",
        "ACN": "秘术师",
        "AST": "占星术士",
        "LMB": "极限技",
        "FAIRY": "小仙女",
        "AUTOTURRET": "浮空炮塔",
        "EGI": "召唤兽",
        "CHOCOBO": "陆行鸟",
    }
}
Language.prototype.get = function (v) {
    try {
        return this[this.lang][v]
    } catch (ex) {
        return v
    }
};
var oStaticPersons = [];

function activeSort(key, merge) {
    if (key.indexOf("merged") > -1) {
        if (key.indexOf("Last") > -1) {
            key = key.replace(/merged/ig, "")
        } else {
            key = key.replace(/merged/ig, "");
            key = key.substr(0, 1).toLowerCase() + key.substr(1)
        }
    }
    if (key == "dmgPct")
        key = "damage%";
    if (key.indexOf("Pct") > -1 && key.indexOf("overHealPct") == -1)
        key = key.replace(/Pct/ig, "%");
    if (key == "encdps" || key == "dps")
        key = "damage";
    if (key == "enchps" || key == "hps")
        key = "healed";
    if (key == "maxhit")
        key = "maxhitval";
    if (key == "maxheal")
        key = "maxhealval";
    return key
}

function staticPerson(e) {
    var d = new Date();
    this.createTime = d.getTime();
    this.person = e;
    this.last180ARR = [];
    this.last180Copy = [];
    this.polygonPoints = []
}

function getLog(e) {
    for (var i in CombatLog) {
        if (CombatLog[i].combatKey == e && lastCombat.encounter.title != "Encounter") {
            lastCombat = CombatLog[i];
            document.dispatchEvent(new CustomEvent('onSuccessGetLog', {
                detail: {
                    combatant: CombatLog[i]
                }
            }));
            return !0
        }
    }
    return !1
}

function safeAdd(x, y) {
    var a = (x & 0xFFFF) + (y & 0xFFFF);
    var b = (x >> 16) + (y >> 16) + (a >> 16);
    return (b << 16) | (a & 0xFFFF)
}

function hexColor(str) {
    var str = str.replace("#", "");
    if (str.length == 6 || str.length == 3) {
        if (str.length == 6)
            return [parseInt(str.substr(0, 2), 16), parseInt(str.substr(2, 2), 16), parseInt(str.substr(4, 2), 16)];
        else return [parseInt(str.substr(0, 1), 16), parseInt(str.substr(1, 1), 16), parseInt(str.substr(2, 1), 16)]
    } else {
        return [0, 0, 0]
    }
}

function oHexColor(str) {
    var data = hexColor(str);
    return {
        r: data[0],
        g: data[1],
        b: data[2]
    }
}

function oHexArgb(str) {
    if (str.length < 8) return {
        a: 0,
        r: 0,
        g: 0,
        b: 0
    };
    var data = oHexColor(str.replace("#", "").substr(2, 6));
    var rgb = str.replace("#", "");
    return {
        a: parseFloat((parseInt(rgb.substr(0, 2), 16) / 255).toFixed(2)),
        r: data.r,
        g: data.g,
        b: data.b
    }
}

function saveLog(e) {
    var exists = !1;
    for (var i in CombatLog) {
        if (CombatLog[i].combatKey == e.combatKey)
            exists = !0
    }
    if (!exists) {
        CombatLog.push(e);
        document.dispatchEvent(new CustomEvent('onSuccessSaveLog', {
            detail: {
                combatant: e
            }
        }))
    }
}

function pFloat(num) {
    return parseFloat(num.nanFix().toFixed(underDot))
}

function loadSetting(key) {
    var json = "";
    try {
        json = localStorage.getItem(key);
        json = JSON.parse(json)
    } catch (ex) {
        return json
    }
    return json
}

function saveSetting(key, val) {
    localStorage.setItem(key, JSON.stringify(val))
}
var combatLog = [];
var combatants = [];
var curhp = 100;
var delayOK = !0;
var jobColors = {
    "PLD": [200, 255, 255],
    "WAR": [200, 40, 30],
    "DRK": [130, 40, 50],
    "MNK": [180, 140, 20],
    "DRG": [50, 90, 240],
    "NIN": [80, 70, 90],
    "BRD": [180, 200, 80],
    "MCH": [130, 255, 240],
    "SMN": [40, 150, 0],
    "BLM": [100, 70, 150],
    "WHM": [200, 195, 170],
    "SCH": [60, 60, 160],
    "AST": [200, 130, 90],
    "LMB": [255, 204, 0]
};
var lastCombatRaw = null;
var lastCombat = null;
var maxhp = 100;
var myID = 0;
var myName = "";
var underDot = 2;
var sortKey = "encdps"

var userLang = "cn";
var Languages = {
	"lang":{
		"cn":"中文",
		"ja":"日本語"
	},
	"data":[
		 "label"
	],
	"label":{
		"ヘヴィスウィング":{"cn":"重劈"},
		"メイム":{"cn":"凶残裂"},
		"攻撃":{"cn":"攻击"},
		"シュトルムヴィント":{"cn":"暴风斩"},
		"シュトルムブレハ":{"cn":"暴风碎"},
		"スカルサンダー":{"cn":"裂骨斩"},
		"ボーラアクス":{"cn":"寒风斧"},
		"アップヒーバル":{"cn":"动乱"},
		"オンスロート":{"cn":"猛攻"},
		"オーバーパワー":{"cn":"超压斧"},
		"スチールサイクロン":{"cn":"钢铁旋风"},
		"デシメート":{"cn":"地毁人亡"},
		"原初の魂":{"cn":"原初之魂"},
		"フェルクリーヴ":{"cn":"FC"},
		"Heavy Swing":{"cn":"重劈"},
		"Maim":{"cn":"凶残裂"},
		"Attack":{"cn":"攻击"},
		"Storm's Path":{"cn":"暴风斩"},
		"Storm's Eye":{"cn":"暴风碎"},
		"Skull Sunder":{"cn":"裂骨斩"},
		"Butcher's Block":{"cn":"寒风斧"},
		"Upheaval":{"cn":"动乱"},
		"Onslaught":{"cn":"猛攻"},
		"Overpower":{"cn":"超压斧"},
		"Steel Cyclone":{"cn":"钢铁旋风"},
		"Decimate":{"cn":"地毁人亡"},
		"Inner Beast":{"cn":"原初之魂"},
		"Fell Cleave":{"cn":"FC"},
		"ゴアブレード":{"cn":"沥血剑"},
		"Goring Blade":{"cn":"沥血剑"},
		"ファストブレード":{"cn":"先锋剑"},
		"Fast Blade":{"cn":"先锋剑"},
		"ライオットソード":{"cn":"暴乱剑"},
		"Riot Blade":{"cn":"暴乱剑"},
		"Royal Authority":{"cn":"王权剑"},
		"ロイヤルアソリティ":{"cn":"王权剑"},
		"ホーリースピリット":{"cn":"圣灵"},
		"Holy Spirit":{"cn":"圣灵"},
		"シールドバッシュ":{"cn":"盾牌猛击"},
		"Shield Bash":{"cn":"盾牌猛击"},
		"レクイエスカット":{"cn":"安魂祈祷"},
		"Requiescat":{"cn":"安魂祈祷"},
		"サークル・オブ・ドゥーム":{"cn":"厄运流转"},
		"Circle of Scorn":{"cn":"厄运流转"},
		"Shield Lob":{"cn":"投盾"},
		"シールドロブ":{"cn":"投盾"},
		"レイジ・オブ・ハルオーネ":{"cn":"战女神之怒"},
		"Rage of Halone":{"cn":"战女神之怒"},
		"サベッジブレード":{"cn":"狂怒剑"},
		"Savage Blade":{"cn":"狂怒剑"},
		"ハードスラッシュ":{"cn":"重斩"},
		"Hard Slash":{"cn":"重斩"},
		"スピンスラッシュ":{"cn":"回环斩"},
		"Spinning Slash":{"cn":"回环斩"},
		"パワースラッシュ":{"cn":"强力斩"},
		"Power Slash":{"cn":"强力斩"},
		"サイフォンストライク":{"cn":"吸收斩"},
		"Syphon Strike":{"cn":"吸收斩"},
		"ソウルイーター":{"cn":"噬魂斩"},
		"Souleater":{"cn":"噬魂斩"},
		"アンメンド":{"cn":"伤残"},
		"Unmend":{"cn":"伤残"},
		"ブラッドスピラー":{"cn":"血溅"},
		"Bloodspiller":{"cn":"血溅"},
		"プランジカット":{"cn":"跳斩"},
		"Plunge":{"cn":"跳斩"},
		"ソルトアース":{"cn":"腐秽大地"},
		"Salted Earth":{"cn":"腐秽大地"},
		"カーヴ・アンド・スピット":{"cn":"精雕怒斩"},
		"Carve and Spit":{"cn":"精雕怒斩"},
		"クワイタス":{"cn":"寂灭"},
		"Quietus":{"cn":"寂灭"},
		"ストーン":{"cn":"飞石"},
		"Stone":{"cn":"飞石"},
		"エアロ":{"cn":"疾风"},
		"Aero":{"cn":"疾风"},
		"ストンラ":{"cn":"坚石"},
		"Stone II":{"cn":"坚石"},
		"エアロラ":{"cn":"烈风"},
		"Aero II":{"cn":"烈风"},
		"ホーリー":{"cn":"神圣"},
		"Holy":{"cn":"神圣"},
		"ストンガ":{"cn":"垒石"},
		"Stone III":{"cn":"垒石"},
		"ストンジャ":{"cn":"崩石"},
		"Stone IV":{"cn":"崩石"},
		"エアロガ":{"cn":"暴风"},
		"Aero III":{"cn":"暴风"},
		"アサイズ":{"cn":"法令"},
		"Assize":{"cn":"法令"},
		"ルイン":{"cn":"毁灭"},
		"Ruin":{"cn":"毁灭"},
		"バイオ":{"cn":"毒菌"},
		"Bio":{"cn":"毒菌"},
		"ミアズマ":{"cn":"瘴气"},
		"Miasma":{"cn":"瘴气"},
		"ミアズラ":{"cn":"瘴疠"},
		"Miasma II":{"cn":"瘴疠"},
		"バイオラ":{"cn":"猛毒菌"},
		"Bio II":{"cn":"猛毒菌"},
		"エナジードレイン":{"cn":"能量吸收"},
		"シャドウフレア":{"cn":"暗影核爆"},
		"Shadow Flare":{"cn":"暗影核爆"},
		"ミアズマバースト":{"cn":"溃烂爆发"},
		"Fester":{"cn":"溃烂爆发"},
		"トライバインド":{"cn":"三重止步"},
		"Tri-bind":{"cn":"三重止步"},
		"ルインラ":{"cn":"毁坏"},
		"Ruin II":{"cn":"毁坏"},
		"ルインガ":{"cn":"毁荡"},
		"Ruin III":{"cn":"毁荡"},
		"ペインフレア":{"cn":"痛苦核爆"},
		"Painflare":{"cn":"痛苦核爆"},
		"ルインジャ":{"cn":"毁绝"},
		"Ruin IV":{"cn":"毁绝"},
		"バイオガ":{"cn":"剧毒菌"},
		"Bio III":{"cn":"剧毒菌"},
		"ミアズガ":{"cn":"瘴暍"},
		"Miasma III":{"cn":"瘴暍"},
		"ウィルムウェーブ":{"cn":"真龙波"},
		"Wyrmwave":{"cn":"真龙波"},
		"アク・モーン":{"cn":"死亡轮回"},
		"Akh Morn":{"cn":"死亡轮回"},
		"デスフレア":{"cn":"死星核爆"},
		"Deathflare":{"cn":"死星核爆"},
		"マレフィク":{"cn":"凶星"},
		"Malefic":{"cn":"凶星"},
		"マレフィラ":{"cn":"灾星"},
		"Malefic II":{"cn":"灾星"},
		"コンバス":{"cn":"烧灼"},
		"Combust":{"cn":"烧灼"},
		"コンバラ":{"cn":"炽灼"},
		"Combust II":{"cn":"炽灼"},
		"グラビデ":{"cn":"重力"},
		"Gravity":{"cn":"重力"},
		"マレフィガ":{"cn":"祸星"},
		"Malefic III":{"cn":"祸星"},
		"クラウンロード":{"cn":"王冠之领主"},
		"Lord of Crowns":{"cn":"王冠之领主"},
		"ブリザド":{"cn":"冰结"},
		"Blizzard":{"cn":"冰结"},
		"ファイア":{"cn":"火炎"},
		"Fire":{"cn":"火炎"},
		"サンダー":{"cn":"闪雷"},
		"Thunder":{"cn":"闪雷"},
		"サンダガ":{"cn":"暴雷"},
		"Fire III":{"cn":"爆炎"},
		"Thunder III":{"cn":"暴雷"},
		"ファイガ":{"cn":"爆炎"},
		"ファイジャ":{"cn":"炽炎"},
		"ブリザジャ":{"cn":"冰澈"},
		"ファウル":{"cn":"秽浊"},
		"フレア":{"cn":"核爆"},
		"フリーズ":{"cn":"玄冰"},
		"Fire IV":{"cn":"炽炎"},
		"Blizzard IV":{"cn":"冰澈"},
		"Foul":{"cn":"秽浊"},
		"Flare":{"cn":"核爆"},
		"Freeze":{"cn":"玄冰"},
		"コラプス":{"cn":"崩溃"},
		"Scathe":{"cn":"崩溃"},
		"サンダジャ":{"cn":"霹雷"},
		"Thunder IV":{"cn":"霹雷"},
		"ジョルト":{"cn":"摇荡"},
		"リポスト":{"cn":"回刺"},
		"ヴァルサンダー":{"cn":"赤闪雷"},
		"コル・ア・コル":{"cn":"短兵相接"},
		"ヴァルエアロ":{"cn":"赤疾风"},
		"Jolt":{"cn":"摇荡"},
		"Riposte":{"cn":"回刺"},
		"Verthunder":{"cn":"赤闪雷"},
		"Corps-a-corps":{"cn":"短兵相接"},
		"Veraero":{"cn":"赤疾风"},
		"スキャッター":{"cn":"散碎"},
		"ヴァルファイア":{"cn":"赤火炎"},
		"ヴァルストーン":{"cn":"赤飞石"},
		"ツヴェルクハウ":{"cn":"交击斩"},
		"ムーリネ":{"cn":"划圆斩"},
		"Scatter":{"cn":"散碎"},
		"Verfire":{"cn":"赤火炎"},
		"Verstone":{"cn":"赤飞石"},
		"Zwerchhau":{"cn":"交击斩"},
		"Moulinet":{"cn":"划圆斩"},
		"ルドゥブルマン":{"cn":"连攻"},
		"フレッシュ":{"cn":"飞刺"},
		"Redoublement":{"cn":"连攻"},
		"Fleche":{"cn":"飞刺"},
		"コントルシクスト":{"cn":"六分反击"},
		"Contre Sixte":{"cn":"六分反击"},
		"インパクト":{"cn":"冲击"},
		"Impact":{"cn":"冲击"},
		"ジョルラ":{"cn":"震荡"},
		"ヴァルフレア":{"cn":"赤核爆"},
		"ヴァルホーリー":{"cn":"赤神圣"},
		"エンリポスト":{"cn":"魔回刺"},
		"エンツヴェルクハウ":{"cn":"魔交击斩"},
		"エンルドゥブルマン":{"cn":"魔连攻"},
		"エンムーリネ":{"cn":"魔划圆斩"},
		"Jolt II":{"cn":"震荡"},
		"Verflare":{"cn":"赤核爆"},
		"Verholy":{"cn":"赤神圣"},
		"Enchanted Riposte":{"cn":"魔回刺"},
		"Enchanted Zwerchhau":{"cn":"魔交击斩"},
		"Enchanted Redoublement":{"cn":"魔连攻"},
		"Enchanted Moulinet":{"cn":"魔划圆斩"},
		"テザー":{"cn":"缚束"},
		"Tether":{"cn":"缚束"},
		"ヘヴィショット":{"cn":"强力射击"},
		"ストレートショット":{"cn":"直线射击"},
		"コースティックバイト":{"cn":"烈毒咬箭"},
		"ストームバイト":{"cn":"狂风蚀箭"},
		"エンピリアルアロー":{"cn":"九天连箭"},
		"Straight Shot":{"cn":"直线射击"},
		"Caustic Bite":{"cn":"烈毒咬箭"},
		"Stormbite":{"cn":"狂风蚀箭"},
		"Empyreal Arrow":{"cn":"九天连箭"},
		"サイドワインダー":{"cn":"侧风诱导箭"},
		"ピッチパーフェクト":{"cn":"完美音调"},
		"旅神のメヌエット":{"cn":"放浪神的小步舞曲"},
		"軍神のパイオン":{"cn":"军神的赞美歌"},
		"Sidewinder":{"cn":"侧风诱导箭"},
		"Pitch Perfect":{"cn":"完美音调"},
		"The Wanderer's Minuet":{"cn":"放浪神的小步舞曲"},
		"Army's Paeon":{"cn":"军神的赞美歌"},
		"アイアンジョー":{"cn":"伶牙俐齿"},
		"Iron Jaws":{"cn":"伶牙俐齿"},
		"ブラッドレッター":{"cn":"失血箭"},
		"Bloodletter":{"cn":"失血箭"},
		"レイン・オブ・デス":{"cn":"死亡箭雨"},
		"Rain of Death":{"cn":"死亡箭雨"},
		"コースティックバイト":{"cn":"烈毒咬箭"},
		"ストームバイト":{"cn":"狂风蚀箭"},
		"Caustic Bite":{"cn":"烈毒咬箭"},
		"Stormbite":{"cn":"狂风蚀箭"},
		"リフルジェントアロー":{"cn":"辉煌箭"},
		"Refulgent Arrow":{"cn":"辉煌箭"},
		"ミザリーエンド":{"cn":"恶终箭"},
		"Misery's End":{"cn":"恶终箭"},
		"スプリットショット":{"cn":"分裂弹"},
		"Split Shot":{"cn":"分裂弹"},
		"スラッグショット":{"cn":"独头弹"},
		"レッドショット":{"cn":"铅弹"},
		"スプレッドショット":{"cn":"散射"},
		"Slug Shot":{"cn":"独头弹"},
		"Lead Shot":{"cn":"铅弹"},
		"Spread Shot":{"cn":"散射"},
		"ホットショット":{"cn":"热弹"},
		"クリーンショット":{"cn":"狙击弹"},
		"ガウスラウンド":{"cn":"虹吸弹"},
		"ハートブレイク":{"cn":"碎心击"},
		"Hot Shot":{"cn":"热弹"},
		"Clean Shot":{"cn":"狙击弹"},
		"Gauss Round":{"cn":"虹吸弹"},
		"Heartbreak":{"cn":"碎心击"},
		"ワイルドファイア":{"cn":"野火"},
		"Wildfire":{"cn":"野火"},
		"ボレーファイア":{"cn":"齐射"},
		"Volley Fire":{"cn":"齐射"},
		"リコシェット":{"cn":"弹射"},
		"Ricochet":{"cn":"弹射"},
		"ショット":{"cn":"射击"},
		"Shot":{"cn":"射击"},
		"クールダウン":{"cn":"冷却"},
		"ヒートスプリットショット":{"cn":"热分裂弹"},
		"ヒートスラッグショット":{"cn":"热独头弹"},
		"ヒートクリーンショット":{"cn":"热狙击弹"},
		"Cooldown":{"cn":"冷却"},
		"Heated Split Shot":{"cn":"热分裂弹"},
		"Heated Slug Shot":{"cn":"热独头弹"},
		"Heated Clean Shot":{"cn":"热狙击弹"},
		"オーバーロード・ルーク":{"cn":"超荷车炮"},
		"オーバーロード・ビショップ":{"cn":"超荷象炮"},
		"Rook Overload":{"cn":"超荷车炮"},
		"Bishop Overload":{"cn":"超荷象炮"},
		"フレイムスロアー":{"cn":"火焰喷射"},
		"チャージドファイア":{"cn":"蓄能齐射"},
		"Charged Volley Fire":{"cn":"蓄能齐射"},
		"チャージドモーター":{"cn":"蓄能以太炮"},		
		"Charged Aether Mortar":{"cn":"蓄能以太炮"},
		"連撃":{"cn":"连击"},
		"正拳突き":{"cn":"正拳"},
		"Bootshine":{"cn":"连击"},
		"True Strike":{"cn":"正拳"},
		"崩拳":{"cn":"崩拳"},
		"Snap Punch":{"cn":"崩拳"},
		"双掌打":{"cn":"双掌打"},
		"壊神衝":{"cn":"破坏神冲"},
		"Twin Snakes":{"cn":"双掌打"},
		"Arm of the Destroyer":{"cn":"破坏神冲"},
		"鉄山靠":{"cn":"铁山靠"},
		"Steel Peak":{"cn":"铁山靠"},
		"破砕拳":{"cn":"破碎拳"},
		"空鳴拳":{"cn":"空鸣拳"},
		"Demolish":{"cn":"破碎拳"},
		"Howling Fist":{"cn":"空鸣拳"},
		"羅刹衝":{"cn":"罗刹冲"},
		"Shoulder Tackle":{"cn":"罗刹冲"},
		"短勁":{"cn":"短劲"},
		"One Ilm Punch":{"cn":"短劲"},
		"双竜脚":{"cn":"双龙脚"},
		"Dragon Kick":{"cn":"双龙脚"},
		"闘魂旋風脚":{"cn":"斗魂脚"},
		"Tornado Kick":{"cn":"斗魂脚"},
		"蒼気砲":{"cn":"苍气炮"},
		"Elixir Field":{"cn":"苍气炮"},
		"陰陽闘気斬":{"cn":"阴阳斩"},
		"the Forbidden Chakra":{"cn":"阴阳斩"},
		"金剛羅刹衝":{"cn":"金刚罗刹冲"},
		"疾風羅刹衝":{"cn":"疾风罗刹冲"},
		"紅蓮羅刹衝":{"cn":"红莲罗刹冲"},
		"Earth Tackle":{"cn":"金刚罗刹冲"},
		"Wind Tackle":{"cn":"疾风罗刹冲"},
		"Fire Tackle":{"cn":"红莲罗刹冲"},
		"刃風":{"cn":"刃风"},
		"陣風":{"cn":"阵风"},
		"士風":{"cn":"士风"},
		"雪風":{"cn":"雪风"},
		"月光":{"cn":"月光"},
		"花車":{"cn":"花车"},
		"Hakaze":{"cn":"刃风"},
		"Jinpu":{"cn":"阵风"},
		"Shifu":{"cn":"士风"},
		"Yukikaze":{"cn":"雪风"},
		"Gekko":{"cn":"月光"},
		"Kasha":{"cn":"花车"},
		"風雅":{"cn":"风雅"},
		"満月":{"cn":"满月"},
		"桜花":{"cn":"樱花"},
		"燕飛":{"cn":"燕飞"},
		"Higanbana":{"cn":"彼岸花"},
		"Higanbana(*)":{"cn":"彼岸花(*)"},
		"天下五剣":{"cn":"天下五剑"},
		"Tenka Goken":{"cn":"天下五剑"},
		"乱れ雪月花":{"cn":"雪月花"},
		"Midare Setsugekka":{"cn":"雪月花"},
		"必殺剣・震天":{"cn":"必杀震天"},
		"Hissatsu: Shinten":{"cn":"必杀震天"},
		"必殺剣・九天":{"cn":"必杀九天"},
		"Hissatsu: Kyuten":{"cn":"必杀九天"},
		"Fuga":{"cn":"风雅"},
		"Mangetsu":{"cn":"满月"},
		"Oka":{"cn":"樱花"},
		"必殺剣・星眼":{"cn":"必杀星眼"},
		"Hissatsu: Seigan":{"cn":"必杀星眼"},
		"トゥルースラスト":{"cn":"精准刺"},
		"ボーパルスラスト":{"cn":"贯通刺"},
		"ヘヴィスラスト":{"cn":"重刺"},
		"インパルスドライヴ":{"cn":"脉冲枪"},
		"ライフサージ":{"cn":"龙剑"},
		"フルスラスト":{"cn":"直刺"},
		"ディセムボウル":{"cn":"开膛枪"},
		"桜華狂咲":{"cn":"樱花怒放"},
		"リング・オブ・ソーン":{"cn":"荆棘环刺"},
		"ピアシングタロン":{"cn":"贯穿尖"},
		"二段突き":{"cn":"二重刺"},
		"ジャンプ":{"cn":"跳跃"},
		"竜槍":{"cn":"龙枪"},
		"スパインダイブ":{"cn":"破碎冲"},
		"ドラゴンダイブ":{"cn":"龙炎冲"},
		"True Thrust":{"cn":"精准刺"},
		"Vorpal Thrust":{"cn":"贯通刺"},
		"Heavy Thrust":{"cn":"重刺"},
		"Impulse Drive":{"cn":"脉冲枪"},
		"Life Surge":{"cn":"龙剑"},
		"Full Thrust":{"cn":"直刺"},
		"Disembowel":{"cn":"开膛枪"},
		"Chaos Thrust":{"cn":"樱花怒放"},
		"Ring of Thorns":{"cn":"荆棘环刺"},
		"Piercing Talon":{"cn":"贯穿尖"},
		"Phlebotomize":{"cn":"二重刺"},
		"Jump":{"cn":"跳跃"},
		"Power Surge":{"cn":"龙枪"},
		"Spineshatter Dive":{"cn":"破碎冲"},
		"Dragonfire Dive":{"cn":"龙炎冲"},
		"竜牙竜爪":{"cn":"龙牙龙爪"},
		"Fang and Claw":{"cn":"龙牙龙爪"},
		"ゲイルスコグル":{"cn":"武神枪"},
		"Geirskogul":{"cn":"武神枪"},
		"竜尾大車輪":{"cn":"龙尾回旋"},
		"Wheeling Thrust":{"cn":"龙尾回旋"},
		"ソニックスラスト":{"cn":"音速刺"},
		"ミラージュダイブ":{"cn":"幻象冲"},
		"ナーストレンド":{"cn":"死者之岸"},
		"Sonic Thrust":{"cn":"音速刺"},
		"Mirage Dive":{"cn":"幻象冲"},
		"Nastrond":{"cn":"死者之岸"},
		"口寄せの術・大蝦蟇":{"cn":"通灵虾蟆"},
		"六道輪廻":{"cn":"六道轮回"},
		"Hellfrog Medium":{"cn":"通灵虾蟆"},
		"Bhavacakra":{"cn":"六道轮回"},
		"双刃旋":{"cn":"双刃旋"},
		"残影":{"cn":"残影"},
		"風断ち":{"cn":"绝风"},
		"蜂毒":{"cn":"蜂毒"},
		"無双旋":{"cn":"无双旋"},
		"かくれる":{"cn":"隐遁"},
		"終撃":{"cn":"断绝"},
		"投刃":{"cn":"飞刀"},
		"ぶんどる":{"cn":"夺取"},
		"不意打ち":{"cn":"出其不意"},
		"舞踏刃":{"cn":"炫舞刃"},
		"血花五月雨":{"cn":"血雨飞花"},
		"旋風刃":{"cn":"旋风刃"},
		"喉斬り":{"cn":"割喉"},
		"影牙":{"cn":"影牙"},
		"だまし討ち":{"cn":"攻其不备"},
		"風魔手裏剣":{"cn":"风魔手里剑"},
		"火遁の術":{"cn":"火遁之术"},
		"雷遁の術":{"cn":"雷遁之术"},
		"氷遁の術":{"cn":"冰遁之术"},
		"風遁の術":{"cn":"风遁之术"},
		"土遁の術":{"cn":"土遁之术"},
		"水遁の術":{"cn":"水遁之术"},
		"Spinning Edge":{"cn":"双刃旋"},
		"Shade Shift":{"cn":"残影"},
		"Gust Slash":{"cn":"绝风"},
		"Kiss of the Wasp":{"cn":"蜂毒"},
		"Mutilate":{"cn":"无双旋"},
		"Assassinate":{"cn":"断绝"},
		"Throwing Dagger":{"cn":"飞刀"},
		"Mug":{"cn":"夺取"},
		"Sneak Attack":{"cn":"出其不意"},
		"Dancing Edge":{"cn":"炫舞刃"},
		"Hide":{"cn":"隐遁"},
		"Death Blossom":{"cn":"血雨飞花"},
		"Aeolian Edge":{"cn":"旋风刃"},
		"Jugulate":{"cn":"割喉"},
		"Shadow Fang":{"cn":"影牙"},
		"Trick Attack":{"cn":"攻其不备"},
		"Fuma Shuriken":{"cn":"风魔手里剑"},
		"Katon":{"cn":"火遁之术"},
		"Raiton":{"cn":"雷遁之术"},
		"Hyoton":{"cn":"冰遁之术"},
		"Huton":{"cn":"风遁之术"},
		"Doton":{"cn":"土遁之术"},
		"Suiton":{"cn":"水遁之术"},
		"ハイマルストーム":{"cn":"严冬风暴"},
		"ホーリーメテオ":{"cn":"陨石圣星"},
		"コメットインパクト":{"cn":"星屑冲击"},
		"メテオインパクト":{"cn":"陨石冲击"},
		"ビッグショット":{"cn":"冲天怒射"},
		"デスペラード":{"cn":"亡命暴徒"},
		"原初の大地":{"cn":"原初大地"},
		"ダークフォース":{"cn":"暗黑之力"},
		"蒼天のドラゴンダイブ":{"cn":"苍穹龙炎"},
		"月遁血祭":{"cn":"月遁血祭"},
		"サジタリウスアロー":{"cn":"射手天箭"},
		"サテライトビーム":{"cn":"卫星光束"},
		"テラフレア":{"cn":"万亿核爆"},
		"エンジェルフェザー":{"cn":"天使之羽"},
		"星天開門":{"cn":"星天开门"},
		"ターミナルベロシティ":{"cn":"终端速度"},
		"生者必滅":{"cn":"生者必灭"},
		"ヴァーミリオンスカージ":{"cn":"赤红灾变"},
		"ブレイバー":{"cn":"勇猛烈斩"},
		"ブレードダンス":{"cn":"刀光剑舞"},
		"ファイナルヘヴン":{"cn":"最终天堂"},
		"スカイシャード":{"cn":"苍穹破碎"},
		"プチメテオ":{"cn":"星体风暴"},
		"メテオ":{"cn":"陨石流星"},
		"Hiemal Storm":{"cn":"严冬风暴"},
		"Holy Meteor":{"cn":"陨石圣星"},
		"Comet Impact":{"cn":"星屑冲击"},
		"Meteor Impact":{"cn":"陨石冲击"},
		"Big Shot":{"cn":"冲天怒射"},
		"Desperado":{"cn":"亡命暴徒"},
		"Land Waker":{"cn":"原初大地"},
		"Dark Force":{"cn":"暗黑之力"},
		"Dragonsong Dive":{"cn":"苍穹龙炎"},
		"Chimatsuri":{"cn":"月遁血祭"},
		"Sagittarius Arrow":{"cn":"射手天箭"},
		"Satellite Beam":{"cn":"卫星光束"},
		"Teraflare":{"cn":"万亿核爆"},
		"Angel Feathers":{"cn":"天使之羽"},
		"Astral Stasis":{"cn":"星天开门"},
		"Terminal Velocity":{"cn":"终端速度"},
		"Doom of the Living":{"cn":"生者必灭"},
		"Vermillion Scourge":{"cn":"赤红灾变"},
		"Braver":{"cn":"勇猛烈斩"},
		"Bladedance":{"cn":"刀光剑舞"},
		"Final Heaven":{"cn":"最终天堂"},
		"Skyshard":{"cn":"苍穹破碎"},
		"Starstorm":{"cn":"星体风暴"},
		"Meteor":{"cn":"陨石流星"}
	},
	
};

if (Languages.lang[userLang] == undefined)
	userLang = "cn";

var curLang = new function()
{
	this.lang = Languages.lang[userLang];
	for(var l in Languages.data)
	{
		for(var i in Languages[Languages.data[l]])
		{
			if(this[Languages.data[l]] == undefined)
				this[Languages.data[l]] = [];

			for(var i in Languages[Languages.data[l]])
			{
				this[Languages.data[l]][i] = Languages[Languages.data[l]][i][userLang];
			}
		}
	}
};


function forTest(str){
	if(curLang.label[str] != undefined){
		str=curLang.label[str];
	}
	return str;
}

