
/**
* Created : 25/01/2022 
*/
export default class BTTVUtils {

	private static _instance:BTTVUtils;

	private enabled = false;
	private emotesLoaded = false;
	private channelList:string[] = [];
	private globalEmotes:BTTVEmote[] = [];
	private globalEmotesHashmaps:{[key:string]:BTTVEmote} = {};
	private channelEmotes:{[key:string]:BTTVEmote[]} = {};
	private channelEmotesHashmaps:{[key:string]:{[key:string]:BTTVEmote}} = {};
	
	constructor() {
	
	}
	
	/********************
	* GETTER / SETTERS *
	********************/
	static get instance():BTTVUtils {
		if(!BTTVUtils._instance) {
			BTTVUtils._instance = new BTTVUtils();
		}
		return BTTVUtils._instance;
	}
	
	
	
	/******************
	* PUBLIC METHODS *
	******************/
	/**
	 * Adds a channel to the list of BTTV emotes to load
	 */
	public addChannel(channelId:string):void {
		this.channelList.push(channelId);
		this.emotesLoaded = false;
	}

	/**
	 * Generates a fake IRC emote tag for future emotes parsing.
	 * 
	 * @param message 
	 * @returns string
	 */
	public generateEmoteTag(message:string, protectedRanges:boolean[]):string {
		if(!this.enabled) return "";

		let fakeTag = "";
		let allEmotes:BTTVEmote[] = [];
		let emotesDone:{[key:string]:boolean} = {};
		const chunks = message.split(/\s/);
		for (let i = 0; i < chunks.length; i++) {
			const txt = chunks[i];
			if(this.globalEmotesHashmaps[txt]) {
				const emote = this.globalEmotesHashmaps[txt];
				if(emote && emotesDone[emote.code] !== true) {
					allEmotes.push( emote );
					emotesDone[emote.code] = true;
				}
			}
			//TODO parse only the emotes from the channel the message was posted to
			for (const key in this.channelEmotesHashmaps) {
				const emote = this.channelEmotesHashmaps[key][txt];
				if(emote && emotesDone[emote.code] !== true) {
					allEmotes.push( emote );
					emotesDone[emote.code] = true;
				}
			}
		}

		//Parse all emotes
		for (let i = 0; i < allEmotes.length; i++) {
			const e = allEmotes[i];
			const name = e.code.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
			const matches = [...message.matchAll(new RegExp(name, "gi"))];
			if(matches && matches.length > 0) {
				//Current emote has been found
				//Generate fake emotes data in the expected format:
				//  ID:start-end,start-end/ID:start-end,start-end
				// fakeTag += "BTTV_"+e.id+":";
				let tmpTag = "BTTV_"+e.id+":";
				let emoteCount = 0;
				for (let j = 0; j < matches.length; j++) {
					const start = (matches[j].index as number);
					const end = start+e.code.length-1;

					if(protectedRanges[start] === true) continue;
					if(protectedRanges[end] === true) continue;

					const prevOK = start == 0 || /\s/.test(message.charAt(start-1));
					const nextOK = end == message.length-1 || /\s/.test(message.charAt(end+1));
					//Emote has no space before and after or is not at the start or end of the message
					//ignore it.
					if(!prevOK || !nextOK) continue;
					emoteCount++;
					tmpTag += start+"-"+end;

					if(j < matches.length-1) tmpTag+=",";
				}
				if(emoteCount) {
					fakeTag += tmpTag;
					if(i < allEmotes.length -1 ) fakeTag +="/";
				}
			}
		}

		return fakeTag;
	}

	/**
	 * Get a BTTV emote data from its code
	 * @param code 
	 * @returns 
	 */
	public getEmoteFromCode(code:string):BTTVEmote|null {
		if(this.globalEmotesHashmaps[code]) {
			return this.globalEmotesHashmaps[code];
		}
		for (const key in this.channelEmotesHashmaps) {
			const list = this.channelEmotesHashmaps[key];
			if(this.channelEmotesHashmaps[key][code]) {
				return this.channelEmotesHashmaps[key][code];
			}
		}
		return null;
	}

	/**
	 * Enables BTTV emotes
	 * Loads up the necessary emotes
	 */
	public async enable():Promise<void> {
		if(!this.emotesLoaded) {
			await this.loadGlobalEmotes();
			for (let i = 0; i < this.channelList.length; i++) {
				await this.loadChannelEmotes( this.channelList[i] );
			}
		}
		this.enabled = true;
		this.emotesLoaded = true;
	}

	/**
	 * Disable BTTV emotes
	 */
	public async disable():Promise<void> {
		this.enabled = false;
	}
	
	
	/*******************
	* PRIVATE METHODS *
	*******************/

	private async loadGlobalEmotes():Promise<void> {
		try {
			const res = await fetch("https://api.betterttv.net/3/cached/emotes/global");
			const json = (await res.json()) as BTTVEmote[];
			this.globalEmotes = json;
			json.forEach(e => {
				this.globalEmotesHashmaps[e.code] = e;
			});
		}catch(error) {
			//
		}
	}
	
	private async loadChannelEmotes(channelId:string):Promise<void> {
		try {
			const res = await fetch("https://api.betterttv.net/3/cached/users/twitch/"+channelId);
			const json = await res.json();
			let emotes:BTTVEmote[] = [];
			if(json.channelEmotes) {
				emotes = emotes.concat(json.channelEmotes);
			}
			if(json.sharedEmotes) {
				emotes = emotes.concat(json.sharedEmotes);
			}
			this.channelEmotes[channelId] = emotes;
			this.channelEmotesHashmaps[channelId] = {};
			emotes.forEach(e => {
				this.channelEmotesHashmaps[channelId][e.code] = e;
			});
		}catch(error) {
			//
		}
	}
}

interface BTTVEmote {
	code:string;
	id:string;
	imageType:string;
	userId:string;
}