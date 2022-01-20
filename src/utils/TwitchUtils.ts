import router from "@/router";
import store from "@/store";
import { Badges } from "tmi.js";
import Config from "./Config";

/**
* Created : 19/01/2021 
*/
export default class TwitchUtils {

	public static client_id:string = "";
	public static badgesCache:{[key:string]:{[key:string]:TwitchTypes.BadgesSet}} = {};
	public static cheermoteCache:{[key:string]:TwitchTypes.CheermoteSet[]} = {};

	public static get oAuthURL():string {
		const path = router.resolve({name:"oauth"}).href;
		const redirect = encodeURIComponent( document.location.origin+path );
		const scopes = encodeURIComponent( Config.TWITCH_APP_SCOPES.join(" ") );

		let url = "https://id.twitch.tv/oauth2/authorize?";
		url += "client_id="+this.client_id
		url += "&redirect_uri="+redirect;
		url += "&response_type=code";
		url += "&scope="+scopes;
		url += "&state=";
		return url;
	}
	
	public static validateToken(oAuthToken:string):Promise<TwitchTypes.Token|TwitchTypes.Error> {
		return new Promise((resolve, reject) => {
			const headers = {
				"Authorization":"Bearer "+oAuthToken
			};
			const options = {
				method: "GET",
				headers: headers,
			};
			fetch("https://id.twitch.tv/oauth2/validate", options)
			.then((result) => {
				if(result.status == 200) {
					result.json().then((json)=> {
						resolve(json)
					});
				}else{
					reject();
				}
			});
		});
	}

	/**
	 * Gets the badges of a channel
	 * @returns
	 */
	public static async loadUserBadges(uid:string):Promise<{[key:string]:TwitchTypes.BadgesSet}> {
		if(this.badgesCache[uid]) return this.badgesCache[uid];

		const headers = {
			// "Authorization":"Bearer "+store.state.authToken,
			// "Client-Id": this.client_id
		};
		const options = {
			method: "GET",
			headers: headers,
		};
		//URL could be replaced with this one to avoid needing an auth token :
		//https://badges.twitch.tv/v1/badges/channels/{UID}/display
		// const result = await fetch("https://api.twitch.tv/helix/chat/badges?broadcaster_id="+uid, options);
		const result = await fetch("https://badges.twitch.tv/v1/badges/channels/"+uid+"/display", options);
		if(result.status == 200) {
			const json = await result.json();
			this.badgesCache[uid] = json.badge_sets;
			// this.badgesCache[uid] = json.data;
			return this.badgesCache[uid];
		}else{
			throw({error:result});
		}
	}

	/**
	 * Gets the badges of a channel
	 * @returns
	 */
	public static async loadGlobalBadges():Promise<{[key:string]:TwitchTypes.BadgesSet}> {
		if(this.badgesCache["global"]) return this.badgesCache["global"];

		const headers = {
			// "Authorization":"Bearer "+store.state.authToken,
			// "Client-Id": this.client_id
		};
		const options = {
			method: "GET",
			headers: headers,
		};
		//URL could be replaced with this one to avoid needing an auth token :
		//https://badges.twitch.tv/v1/badges/global/display
		// const result = await fetch("https://api.twitch.tv/helix/chat/badges/global", options);
		const result = await fetch("https://badges.twitch.tv/v1/badges/global/display", options);
		if(result.status == 200) {
			const json = await result.json();
			this.badgesCache["global"] = json.badge_sets;
			// this.badgesCache["global"] = json.data;
			return this.badgesCache["global"];
		}else{
			throw({error:result});
		}
	}
	
	/**
	 * Converts a chat message badges to actual badges instances with images and IDs.
	 * @param userBadges
	 * @returns 
	 */
	public static getBadgesImagesFromRawBadges(channelId:string, userBadges:Badges|undefined):TwitchTypes.Badge[] {
		const result:TwitchTypes.Badge[] = [];
		for (const userBadgeCategory in userBadges) {
			const userBadgeID = userBadges[ userBadgeCategory ] as string;
			const caches = [this.badgesCache[channelId], this.badgesCache["global"]];
			for (let i = 0; i < caches.length; i++) {
				const cache = caches[i];
				if(!cache) continue;
				const badgeSet = cache[userBadgeCategory];
				if(badgeSet) {
					const badge = badgeSet.versions[userBadgeID];
					if(badge) {
						result.push(badge);
						break;
					}
				}
			}
		}
		return result;
	}

	/**
	 * Replaces emotes by image tags on the message
	 */
	public static parseEmotes(message:string, emotes:string|undefined, removeEmotes:boolean = false):{type:string, value:string, emote?:string}[] {
		if(!emotes || emotes.length == 0) {
			return [{type:"text", value:message}];
		}

		const emotesList:{id:string, start:number, end:number}[] = [];
		//Parse raw emotes data
		const chunks = (emotes as string).split("/");
		for (let i = 0; i < chunks.length; i++) {
			const c = chunks[i];
			const id = c.split(":")[0];
			const positions = c.split(":")[1].split(",");
			for (let j = 0; j < positions.length; j++) {
				const p = positions[j];
				const start = parseInt(p.split("-")[0]);
				const end = parseInt(p.split("-")[1]);
				emotesList.push({id, start, end});
			}
		}
		//Sort emotes by start position
		emotesList.sort((a,b) => a.start - b.start)

		let cursor = 0;
		const result:{type:string, emote?:string, value:string}[] = [];
		//Convert emotes to image tags
		for (let i = 0; i < emotesList.length; i++) {
			const e = emotesList[i];
			if(cursor < e.start) result.push( {type:"text", value:message.substring(cursor, e.start)} );
			if(!removeEmotes) {
				const code = message.substring(e.start, e.end + 1);
				result.push( {type:"emote", emote:code, value:"https://static-cdn.jtvnw.net/emoticons/v2/"+e.id+"/default/light/1.0"} );
			}
			cursor = e.end + 1;
		}
		result.push( {type:"text", value:message.substring(cursor)} );
		
		return result;
	}

	/**
	 * Replaces emotes by image tags on the message
	 */
	public static async parseCheermotes(message:string, channel_id:string):Promise<string> {
		let emotes:TwitchTypes.CheermoteSet[];
		try {
			emotes = await this.loadCheermoteList(channel_id);
		}catch(err) {
			//Safe crash
			return message;
		}

		for (let j = 0; j < emotes.length; j++) {
			const list = emotes[j];
			
			const reg = new RegExp(list.prefix+"[0-9]+", "gi");
			const matches = message.match(reg) as RegExpMatchArray;
			if(!matches) continue;
			//Parse all the current cheermote matches
			for (let k = 0; k < matches.length; k++) {
				const m = matches[k];
				const bitsCount = parseInt(m.replace(list.prefix, ""));
				let tiers = list.tiers[0];
				//Search for the lower nearest existing tier with the specified value
				for (let i = 1; i < list.tiers.length; i++) {
					if(bitsCount < list.tiers[i].min_bits) {
						tiers = list.tiers[i-1];
						break;
					}
				}
				
				let img = tiers.images.dark.animated["2"];
				if(!img) img = tiers.images.dark.static["2"];
				message = message.replace(new RegExp(list.prefix+bitsCount, "gi"), "<img src='"+img+"' class='cheermote'>")
			}
		}
		return message;
	}

	/**
	 * Gets channels infos by their ID.
	 * Only works with a bearer token, not a TMI token !
	 * 
	 * @param logins 
	 * @returns 
	 */
	public static async loadChannelsInfo(logins:string[]):Promise<unknown> {

		if(logins) {
			logins = logins.filter(v => v != null && v != undefined);
			logins = logins.map(v => encodeURIComponent(v));
		}
		
		const params = "login="+logins.join("&login=");
		const url = "https://api.twitch.tv/helix/users?"+params;
		const access_token = (store.state.oAuthToken as TwitchTypes.AuthTokenResult).access_token;
		const result = await fetch(url, {
			headers:{
				"Client-ID": this.client_id,
				"Authorization": "Bearer "+access_token,
				"Content-Type": "application/json",
			}
		});
		return result;
	}
	
	/***
	 * Allow or reject an automoded message
	 */
	public static async modMessage(accept:boolean, messageId:string):Promise<boolean> {
		const options = {
			method:"POST",
			headers: {
				'Authorization': 'Bearer '+(store.state.oAuthToken as TwitchTypes.AuthTokenResult).access_token,
				'Client-Id': this.client_id,
				'Content-Type': "application/json",
			},
			body: JSON.stringify({
				user_id:store.state.user.user_id,
				msg_id:messageId,
				action:accept? "ALLOW" : "DENY",
			})
		}
		const res = await fetch("https://api.twitch.tv/helix/moderation/automod/message", options);
		return res.status <= 400;
	}

	/**
	 * Get the moderators list of a channel
	 */
	public static async getModsList():Promise<{ user_id:string, user_login:string, user_name:string }[]> {
		const options = {
			method:"GET",
			headers: {
				'Authorization': 'Bearer '+(store.state.oAuthToken as TwitchTypes.AuthTokenResult).access_token,
				'Client-Id': this.client_id,
				'Content-Type': "application/json",
			},
		}
		const res = await fetch("https://api.twitch.tv/helix/moderation/moderators?broadcaster_id="+store.state.user.user_id, options);
		const json = await res.json();
		return json.data;
		
	}

	/**
	 * Get the moderators list of a channel
	 */
	public static async loadCheermoteList(uid:string):Promise<TwitchTypes.CheermoteSet[]> {
		if(this.cheermoteCache[uid]) return this.cheermoteCache[uid];
		
		const options = {
			method:"GET",
			headers: {
				'Authorization': 'Bearer '+(store.state.oAuthToken as TwitchTypes.AuthTokenResult).access_token,
				'Client-Id': this.client_id,
				'Content-Type': "application/json",
			},
		}
		const res = await fetch("https://api.twitch.tv/helix/bits/cheermotes?broadcaster_id="+store.state.user.user_id, options);
		const json = await res.json();
		this.cheermoteCache[uid] = json.data;
		return json.data;
	}

	/**
	 * Create a poll
	 */
	public static async createPoll(question:string, answers:string[], duration:number, bitsPerVote:number = 0, pointsPerVote:number = 0):Promise<TwitchTypes.Poll[]> {
		const options = {
			method:"POST",
			headers: {
				'Authorization': 'Bearer '+(store.state.oAuthToken as TwitchTypes.AuthTokenResult).access_token,
				'Client-Id': this.client_id,
				'Content-Type': "application/json",
			},
			body: JSON.stringify({
				broadcaster_id:store.state.user.user_id,
				title:question,
				choices:answers.map(v => {return {title:v}}),
				duration,
				bits_voting_enabled:bitsPerVote > 0,
				bits_per_vote:bitsPerVote,
				channel_points_voting_enabled:pointsPerVote > 0,
				channel_points_per_vote:pointsPerVote,
			})
		}
		const res = await fetch("https://api.twitch.tv/helix/polls", options);
		const json = await res.json();
		if(res.status == 200) {
			setTimeout(()=> {
				this.getPolls();
			}, (duration+1) * 1000);
			store.dispatch("setPolls", json.data);
			return json.data;
		}
		throw(json);
	}

	/**
	 * Get a list of the latest polls
	 */
	public static async getPolls():Promise<TwitchTypes.Poll[]> {
		const options = {
			method:"GET",
			headers: {
				'Authorization': 'Bearer '+(store.state.oAuthToken as TwitchTypes.AuthTokenResult).access_token,
				'Client-Id': this.client_id,
				'Content-Type': "application/json",
			},
		}
		const res = await fetch("https://api.twitch.tv/helix/polls?broadcaster_id="+store.state.user.user_id, options);
		const json = await res.json();
		if(res.status == 200) {
			store.dispatch("setPolls", json.data);
			return json.data;
		}
		throw(json);
	}

	/**
	 * Ends a poll
	 */
	public static async endPoll(pollId:string):Promise<TwitchTypes.Poll[]> {
		const options = {
			method:"PATCH",
			headers: {
				'Authorization': 'Bearer '+(store.state.oAuthToken as TwitchTypes.AuthTokenResult).access_token,
				'Client-Id': this.client_id,
				'Content-Type': "application/json",
			},
			body: JSON.stringify({
				id:pollId,
				status:"TERMINATED",
				broadcaster_id:store.state.user.user_id,
			})
		}
		const res = await fetch("https://api.twitch.tv/helix/polls", options);
		const json = await res.json();
		if(res.status == 200) {
			store.dispatch("setPolls", json.data);
			return json.data;
		}
		throw(json);
	}


	

	/**
	 * Create a prediction
	 */
	public static async createPrediction(question:string, answers:string[], duration:number):Promise<TwitchTypes.Prediction[]> {
		const options = {
			method:"POST",
			headers: {
				'Authorization': 'Bearer '+(store.state.oAuthToken as TwitchTypes.AuthTokenResult).access_token,
				'Client-Id': this.client_id,
				'Content-Type': "application/json",
			},
			body: JSON.stringify({
				broadcaster_id:store.state.user.user_id,
				title:question,
				outcomes:answers.map(v => {return {title:v}}),
				prediction_window:duration,
			})
		}
		const res = await fetch("https://api.twitch.tv/helix/predictions", options);
		const json = await res.json();
		if(res.status == 200) {
			setTimeout(()=> {
				this.getPredictions();
			}, (duration+1) * 1000);
			store.dispatch("setPredictions", json.data);
			return json.data;
		}
		throw(json);
	}

	/**
	 * Get a list of the latest predictions
	 */
	public static async getPredictions():Promise<TwitchTypes.Prediction[]> {
		const options = {
			method:"GET",
			headers: {
				'Authorization': 'Bearer '+(store.state.oAuthToken as TwitchTypes.AuthTokenResult).access_token,
				'Client-Id': this.client_id,
				'Content-Type': "application/json",
			},
		}
		const res = await fetch("https://api.twitch.tv/helix/predictions?broadcaster_id="+store.state.user.user_id, options);
		const json = await res.json();
		if(res.status == 200) {
			store.dispatch("setPredictions", json.data);
			return json.data;
		}
		throw(json);
	}

	/**
	 * Ends a prediction
	 */
	public static async endPrediction(pollId:string, winId:string, cancel:boolean = false):Promise<TwitchTypes.Prediction[]> {
		const options = {
			method:"PATCH",
			headers: {
				'Authorization': 'Bearer '+(store.state.oAuthToken as TwitchTypes.AuthTokenResult).access_token,
				'Client-Id': this.client_id,
				'Content-Type': "application/json",
			},
			body: JSON.stringify({
				id:pollId,
				status:cancel? "CANCELED" : "RESOLVED",
				winning_outcome_id:winId,
				broadcaster_id:store.state.user.user_id,
			})
		}
		const res = await fetch("https://api.twitch.tv/helix/predictions", options);
		const json = await res.json();
		if(res.status == 200) {
			store.dispatch("setPredictions", json.data);
			return json.data;
		}
		throw(json);
	}




	/**
	 * Get the latest hype train info
	 */
	public static async getHypeTrains():Promise<TwitchTypes.HypeTrain[]> {
		const options = {
			method:"GET",
			headers: {
				'Authorization': 'Bearer '+(store.state.oAuthToken as TwitchTypes.AuthTokenResult).access_token,
				'Client-Id': this.client_id,
				'Content-Type': "application/json",
			},
		}
		const res = await fetch("https://api.twitch.tv/helix/hypetrain/events?broadcaster_id="+store.state.user.user_id, options);
		const json = await res.json();
		if(res.status == 200) {
			return json.data;
		}
		throw(json);
	}
}

export namespace TwitchTypes {
	export interface Token {
		client_id: string;
		login: string;
		scopes: string[];
		user_id: string;
		expires_in: number;
	}
	
	export interface Error {
		status: number;
		message: string;
	}

	export interface Moderator {
		user_id: string;
		user_login: string;
		user_naùe: string;
	}

	export interface StreamInfo {
		id:            string;
		user_id:       string;
		user_login:    string;
		user_name:     string;
		game_id:       string;
		game_name:     string;
		type:          string;
		title:         string;
		viewer_count:  number;
		started_at:    string;
		language:      string;
		thumbnail_url: string;
		tag_ids:       string[];
	}

	export interface UserInfo {
		id:                string;
		login:             string;
		display_name:      string;
		type:              string;
		broadcaster_type:  string;
		description:       string;
		profile_image_url: string;
		offline_image_url: string;
		view_count:        number;
		created_at:        string;
		
		//Custom injected data from server.
		streamInfos:       StreamInfo;
		//Custom injected data from server.
		rawData:       {
			id:string;
			lastActivity:number;//Timestamp
			created_at:number;//Timestamp
			description?:string;
			/**
			 * @deprecated Don't use this, it's only here for legacy purpose.
			 */
			name?:string;
		};
	}

	export interface BadgesSet {
		versions: {[key:string]:Badge};
	}

	export interface Badge {
		id: string;
		click_action: string;
		click_url: string;
		description: string;
		image_url_1x: string;
		image_url_2x: string;
		image_url_4x: string;
	}

	export interface AuthTokenResult {
		access_token: string;
		expires_in: number;
		refresh_token: string;
		scope: string[];
		token_type: string;
		//Custom injected data
		expires_at: number;
	}

	export interface CheermoteSet {
		prefix: string;
		tiers: CheermoteTier[];
		type: string;
		order: number;
		last_updated: Date;
		is_charitable: boolean;
	}
	export interface CheermoteTier {
		min_bits: number;
		id: string;
		color: string;
		images: {
			dark: CheermoteImageSet;
			light: CheermoteImageSet;
		};
		can_cheer: boolean;
		show_in_bits_card: boolean;
	}

	export interface CheermoteImageSet {
		animated: CheermoteImage;
		static: CheermoteImage;
	}

	export interface CheermoteImage {
		"1": string;
		"2": string;
		"3": string;
		"4": string;
		"1.5": string;
	}

	export interface Poll {
		id: string;
		broadcaster_id: string;
		broadcaster_name: string;
		broadcaster_login: string;
		title: string;
		choices: PollChoice[];
		bits_voting_enabled: boolean;
		bits_per_vote: number;
		channel_points_voting_enabled: boolean;
		channel_points_per_vote: number;
		status: "ACTIVE" | "COMPLETED" | "TERMINATED" | "ARCHIVED" | "MODERATED" | "INVALID";
		duration: number;
		started_at: string;
		ended_at?: string;
	}

	export interface PollChoice {
		id: string;
		title: string;
		votes: number;
		channel_points_votes: number;
		bits_votes: number;
	}

	export interface HypeTrain {
		id: string;
		event_type: string;
		event_timestamp: Date;
		version: string;
		event_data: {
			broadcaster_id: string;
			cooldown_end_time: string;
			expires_at: string;
			goal: number;
			id: string;
			last_contribution: {
				total: number;
				type: string;
				user: string;
			};
			level: number;
			started_at: string;
			top_contributions: {
				total: number;
				type: string;
				user: string;
			};
			total: number;
		};
	}

	export interface Prediction {
		id: string;
		broadcaster_id: string;
		broadcaster_name: string;
		broadcaster_login: string;
		title: string;
		winning_outcome_id?: string;
		outcomes: PredictionOutcome[];
		prediction_window: number;
		status: "ACTIVE" | "RESOLVED" | "CANCELED" | "LOCKED";
		created_at: string;
		ended_at: string;
		locked_at?: string;
	}

	export interface PredictionOutcome {
		id: string;
		title: string;
		users: number;
		channel_points: number;
		top_predictors?: {
			user:{
				id:string
				name:string
				login:string
				channel_points_used:number
				channel_points_won:number
			}
		}[];
		color: string;
	}
}