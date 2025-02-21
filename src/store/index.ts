import router from '@/router';
import type { TwitchDataTypes } from '@/types/TwitchDataTypes';
import BTTVUtils from '@/utils/BTTVUtils';
import type { BingoData, RaffleData, RaffleEntry, TrackedUser, WheelItem } from '@/utils/CommonDataTypes';
import Config from '@/utils/Config';
import DeezerHelper from '@/utils/DeezerHelper';
import DeezerHelperEvent from '@/utils/DeezerHelperEvent';
import FFZUtils from '@/utils/FFZUtils';
import IRCClient from '@/utils/IRCClient';
import IRCEvent from '@/utils/IRCEvent';
import type { ActivityFeedData, IRCEventData, IRCEventDataList } from '@/utils/IRCEventDataTypes';
import { getTwitchatMessageType, TwitchatMessageType, type ChatMessageTypes } from '@/utils/IRCEventDataTypes';
import OBSWebsocket from '@/utils/OBSWebsocket';
import PublicAPI from '@/utils/PublicAPI';
import PubSub from '@/utils/PubSub';
import type { PubSubDataTypes } from '@/utils/PubSubDataTypes';
import SchedulerHelper from '@/utils/SchedulerHelper';
import SevenTVUtils from '@/utils/SevenTVUtils';
import type { SpotifyAuthResult, SpotifyAuthToken } from '@/utils/SpotifyDataTypes';
import SpotifyHelper from '@/utils/SpotifyHelper';
import SpotifyHelperEvent from '@/utils/SpotifyHelperEvent';
import { TriggerTypes } from '@/utils/TriggerActionData';
import TriggerActionHandler from '@/utils/TriggerActionHandler';
import TTSUtils from '@/utils/TTSUtils';
import TwitchatEvent from '@/utils/TwitchatEvent';
import TwitchCypherPlugin from '@/utils/TwitchCypherPlugin';
import TwitchUtils from '@/utils/TwitchUtils';
import UserSession from '@/utils/UserSession';
import Utils from '@/utils/Utils';
import type VoiceAction from '@/utils/VoiceAction';
import VoiceController from '@/utils/VoiceController';
import VoicemodEvent from '@/utils/VoicemodEvent';
import VoicemodWebSocket, { type VoicemodTypes } from '@/utils/VoicemodWebSocket';
import type { ChatUserstate, UserNoticeState } from 'tmi.js';
import type { JsonArray, JsonObject, JsonValue } from 'type-fest';
import { createStore } from 'vuex';
import { TwitchatAdTypes, type AlertParamsData, type AutomodParamsData, type AutomodParamsKeywordFilterData, type BingoConfig, type BotMessageField, type ChatAlertInfo, type ChatHighlightInfo, type ChatHighlightOverlayData, type ChatPollData, type CommandData, type CountdownData, type EmergencyFollowerData, type EmergencyModeInfo, type EmergencyParamsData, type HypeTrainStateData, type IAccountParamsCategory, type IBotMessage, type InstallHandler, type IParameterCategory, type IRoomStatusCategory, type MusicPlayerParamsData, type OBSMuteUnmuteCommands, type OBSSceneCommand, type ParameterCategory, type ParameterData, type PermissionsData, type ShoutoutTriggerData, type SpoilerParamsData, type StreamInfoPreset, type TriggerActionObsData, type TriggerActionTypes, type TriggerData, type TTSParamsData, type TwitchatAdStringTypes, type VoicemodParamsData } from '../types/TwitchatDataTypes';
import Store from './Store';

//TODO split that giant mess into sub stores

const store = createStore({
	state: {
		latestUpdateIndex: 9,
		refreshTokenTO: 5,
		initComplete: false,
		authenticated: false,
		showParams: false,
		devmode: false,
		canSplitView: false,
		hasChannelPoints: false,
		emergencyModeEnabled: false,
		ahsInstaller: null as InstallHandler|null,
		alert: "",
		tooltip: "",
		userCard: "",
		searchMessages: "",
		cypherKey: "",
		newScopeToRequest: [] as string[],
		cypherEnabled: false,
		commercialEnd: 0,//Date.now() + 120000,
		chatMessages: [] as ChatMessageTypes[],
		pinedMessages: [] as IRCEventDataList.Message[],
		activityFeed: [] as ActivityFeedData[],
		mods: [] as TwitchDataTypes.ModeratorUser[],
		currentPoll: {} as TwitchDataTypes.Poll,
		currentPrediction: {} as TwitchDataTypes.Prediction,
		tmiUserState: {} as UserNoticeState,
		emoteSelectorCache: {} as {user:TwitchDataTypes.UserInfo, emotes:TwitchDataTypes.Emote[]}[],
		trackedUsers: [] as TrackedUser[],
		onlineUsers: [] as string[],
		voiceActions: [] as VoiceAction[],
		myFollowings: {} as {[key:string]:boolean},
		elevatedMessages: [] as IRCEventDataList.Message[],
		voiceLang: "en-US",
		voiceText: {
			tempText:"",
			rawTempText:"",
			finalText:"",
		},
		raffle: null as RaffleData | null,
		chatPoll: null as ChatPollData | null,
		bingo: null as BingoData | null,
		whispers: {} as  {[key:string]:IRCEventDataList.Whisper[]},
		whispersUnreadCount: 0 as number,
		hypeTrain: {} as HypeTrainStateData,
		raiding: null as PubSubDataTypes.RaidInfos|null,
		realHistorySize: 5000,
		followingStates: {} as {[key:string]:boolean},
		followingStatesByNames: {} as {[key:string]:boolean},
		userPronouns: {} as {[key:string]:string|boolean},
		playbackState: null as PubSubDataTypes.PlaybackInfo|null,
		communityBoostState: null as PubSubDataTypes.CommunityBoost|null,
		tempStoreValue: null as unknown,
		obsConnectionEnabled: null as boolean|null,
		obsSceneCommands: [] as OBSSceneCommand[],
		obsMuteUnmuteCommands: {audioSourceName:"", muteCommand:"!mute", unmuteCommand:"!unmute"} as OBSMuteUnmuteCommands,
		obsCommandsPermissions: {mods:false, vips:false, subs:false, all:false, users:""} as PermissionsData,
		spotifyAuthParams: null as SpotifyAuthResult|null,
		spotifyAuthToken: null as SpotifyAuthToken|null,
		deezerConnected: false,
		triggers: {} as {[key:string]:TriggerData},
		streamInfoPreset: [] as StreamInfoPreset[],
		timerStart: 0,
		countdown: null as CountdownData|null,
		lastRaiderLogin: null as string|null,
		botMessages: {
			raffleStart: {
				enabled:true,
				message:"/announce 🎉🎉🎉 Raffle has started 🎉🎉🎉 Use {CMD} command to enter!",
			},
			raffle: {
				enabled:true,
				message:"/announce 🎉🎉🎉 Congrats @{USER} you won the raffle 🎉🎉🎉",
			},
			raffleJoin: {
				enabled:true,
				message:"VoteYea @{USER} you entered the raffle.",
			},
			bingoStart: {
				enabled:true,
				message:"/announce 🎉🎉🎉 Bingo has started 🎉🎉🎉 {GOAL}",
			},
			bingo: {
				enabled:true,
				message:"/announce 🎉🎉🎉 Congrats @{USER} you won the bingo 🎉🎉🎉",
			},
			shoutout: {
				enabled:true,
				message:"/announce Go checkout {USER} {URL} . Their last stream title was \"{TITLE}\" in category \"{CATEGORY}\".",
			},
			twitchatAd: {
				enabled:false,
				message:"/announcepurple Are you a Twitch streamer? I'm using GivePLZ twitchat.fr TakeNRG, a full featured chat alternative for streamers. Take a look at it if you wish KomodoHype",
			},
		} as IBotMessage,
		commands: [
			{
				id:"updates",
				cmd:"/updates",
				details:"Show latest Twitchat updates",
			},
			{
				id:"tip",
				cmd:"/tip",
				details:"Get a tip about Twitchat",
			},
			{
				id:"timerStart",
				cmd:"/timerStart",
				details:"Start a timer",
			},
			{
				id:"timerStop",
				cmd:"/timerStop",
				details:"Stop the timer",
			},
			{
				id:"countdown",
				cmd:"/countdown {(hh:)(mm:)ss}",
				details:"Start a countdown",
			},
			{
				id:"search",
				cmd:"/search {text}",
				details:"Search for a message by its content",
			},
			{
				id:"userinfo",
				cmd:"/userinfo {user}",
				details:"Opens a user's profile info",
			},
			{
				id:"raffle",
				cmd:"/raffle",
				details:"Start a raffle",
			},
			{
				id:"bingo",
				cmd:"/bingo {number|emote}",
				details:"Create a bingo session",
			},
			{
				id:"raid",
				cmd:"/raid {user}",
				details:"Raid someone",
			},
			{
				id:"so",
				cmd:"/so {user}",
				details:"Shoutout a user",
			},
			{
				id:"poll",
				cmd:"/poll {title}",
				details:"Start a poll",
				needChannelPoints:true,
			},
			{
				id:"chatsugg",
				cmd:"/chatsugg",
				details:"Start a chat suggestion",
			},
			{
				id:"prediction",
				cmd:"/prediction {title}",
				details:"Start a prediction",
				needChannelPoints:true,
			},
			{
				id:"announce",
				cmd:"/announce {message}",
				details:"Makes an announcement",
				needChannelPoints:false,
			},
			{
				id:"announceblue",
				cmd:"/announceblue {message}",
				details:"Makes an announcement",
				needChannelPoints:false,
			},
			{
				id:"announcegreen",
				cmd:"/announcegreen {message}",
				details:"Makes an announcement",
				needChannelPoints:false,
			},
			{
				id:"announceorange",
				cmd:"/announceorange {message}",
				details:"Makes an announcement",
				needChannelPoints:false,
			},
			{
				id:"announcepurple",
				cmd:"/announcepurple {message}",
				details:"Makes an announcement",
				needChannelPoints:false,
			},
			{
				id:"commercial",
				cmd:"/commercial {duration}",
				details:"Starts an ad. Duration: 30, 60, 90, 120, 150 or 180",
				needChannelPoints:false,
			},
			{
				id:"vip",
				cmd:"/vip {user}",
				details:"Give VIP status to a user",
				needChannelPoints:true,
			},
			{
				id:"unvip",
				cmd:"/unvip {user}",
				details:"Remove VIP status from a user",
				needChannelPoints:true,
			},
			{
				id:"to",
				cmd:"/timeout {user} {duration} {reason}",
				details:"Ban a user temporarily",
			},
			{
				id:"unban",
				cmd:"/unban {user}",
				details:"Unban a user",
			},
			{
				id:"tts",
				cmd:"/tts {user}",
				details:"Start reading the messages of a user",
				needTTS:true,
			},
			{
				id:"ttsoff",
				cmd:"/ttsoff {user}",
				details:"Stop reading the messages of a user",
				needTTS:true,
			},
			{
				id:"block",
				cmd:"/block {user}",
				details:"Block a user",
			},
			{
				id:"Unblock",
				cmd:"/unblock {user}",
				details:"Unblock a user",
			}
		] as CommandData[],

		params: {
			features: {
				spoilersEnabled: 			{save:true, type:"toggle", value:true, label:"Enable spoiler tag", id:216, icon:"show_purple.svg"},
				alertMode: 					{save:true, type:"toggle", value:true, label:"Enable chat alert", id:217, icon:"alert_purple.svg"},
				receiveWhispers: 			{save:true, type:"toggle", value:true, label:"Receive whispers", id:200, icon:"whispers_purple.svg"},
				showWhispersOnChat: 		{save:true, type:"toggle", value:true, label:"Show whispers on chat", id:214, icon:"conversation_purple.svg", parent:200},
				firstMessage: 				{save:true, type:"toggle", value:true, label:"Show the first message of every viewer on a seperate list so you don't forget to say hello", id:201, icon:"firstTime_purple.svg", example:"greetThem.png"},
				conversationsEnabled: 		{save:true, type:"toggle", value:true, label:"Group conversations (allows to display conversations between users seperately)", id:202, icon:"conversation_purple.svg", example:"conversation.gif"},
				userHistoryEnabled: 		{save:true, type:"toggle", value:true, label:"Group a user's messages when hovering their name", id:203, icon:"conversation_purple.svg", example:"userHistory.gif"},
				markAsRead: 				{save:true, type:"toggle", value:true, label:"Click a message to remember where you stopped reading", id:204, icon:"read_purple.svg"},
				lockAutoScroll: 			{save:true, type:"toggle", value:false, label:"Pause chat on hover", id:205, icon:"pause_purple.svg"},
				showModTools: 				{save:true, type:"toggle", value:true, label:"Show mod tools (TO,ban,delete)", id:206, icon:"ban_purple.svg"},
				raidStreamInfo: 			{save:true, type:"toggle", value:true, label:"Show last stream info of the raider", id:207, icon:"raid_purple.svg", example:"raidStreamInfo.png"},
				raidHighlightUser: 			{save:true, type:"toggle", value:true, label:"Highlight raider's messages for 5 minutes", id:209, icon:"raidHighlight.svg", example:"raidHighlightUser.png"},
				groupIdenticalMessage:		{save:true, type:"toggle", value:true, label:"Group identical messages of a user (sending the exact same message less than 30s later brings it back to bottom and increments a counter on it)", id:208, icon:"increment_purple.svg", example:"groupIdenticalMessage.gif"},
				keepHighlightMyMessages:	{save:true, type:"toggle", value:false, label:"Show \"highlight my message\" rewards in activity feed", id:210, icon:"notification_purple.svg"},
				notifyJoinLeave:			{save:true, type:"toggle", value:false, label:"Notify when a user joins/leaves the chat", id:211, icon:"notification_purple.svg"},
				stopStreamOnRaid:			{save:true, type:"toggle", value:false, label:"Cut OBS stream after a raid", id:212, icon:"obs_purple.svg"},
				showUserPronouns:			{save:true, type:"toggle", value:false, label:"Show user pronouns", id:213, icon:"user_purple.svg"},
			} as {[key:string]:ParameterData},
			appearance: {
				splitView: 					{save:true, type:"toggle", value:true, label:"Split view if page is more than 450px wide (chat on left, notif/activities/greet on right)", id:13, icon:"split_purple.svg"},
				splitViewSwitch: 			{save:true, type:"toggle", value:false, label:"Switch columns", id:15, parent:13},
				splitViewVertical: 			{save:true, type:"toggle", value:false, label:"Split vertically", id:21, parent:13},
				hideChat: 					{save:false, type:"toggle", value:false, label:"Hide chat (if you want only the activity feed on an OBS dock)", id:18, icon:"nochat_purple.svg"},
				highlightMods: 				{save:true, type:"toggle", value:true, label:"Highlight Mods", id:9, icon:"mod_purple.svg"},
				highlightVips: 				{save:true, type:"toggle", value:false, label:"Highlight VIPs", id:10, icon:"vip_purple.svg"},
				highlightSubs: 				{save:true, type:"toggle", value:false, label:"Highlight Subs", id:11, icon:"sub_purple.svg"},
				firstTimeMessage: 			{save:true, type:"toggle", value:true, label:"Highlight first message (all time)", id:7, icon:"firstTime_purple.svg", example:"firstMessage.png"},
				highlightNonFollowers: 		{save:true, type:"toggle", value:false, label:"Indicate non-followers (network intensive)", id:16, icon:"unfollow_purple.svg", example:"nofollow.png"},
				highlightMentions: 			{save:true, type:"toggle", value:true, label:"Highlight messages mentioning me", id:1, icon:"broadcaster_purple.svg"},
				translateNames:				{save:true, type:"toggle", value:true, label:"Translate user names", id:22, icon:"translate_purple.svg", example:"translate.png"},
				showViewersCount: 			{save:true, type:"toggle", value:true, label:"Show viewers count", id:17, icon:"user_purple.svg"},
				showEmotes: 				{save:true, type:"toggle", value:true, label:"Show emotes", id:2, icon:"emote_purple.svg"},
				bttvEmotes: 				{save:true, type:"toggle", value:false, label:"Show BTTV emotes", id:3, icon:"emote_purple.svg", parent:2},
				ffzEmotes: 					{save:true, type:"toggle", value:false, label:"Show FFZ emotes", id:19, icon:"emote_purple.svg", parent:2},
				sevenTVEmotes: 				{save:true, type:"toggle", value:false, label:"Show 7TV emotes", id:20, icon:"emote_purple.svg", parent:2},
				showBadges: 				{save:true, type:"toggle", value:true, label:"Show badges", id:4, icon:"badge_purple.svg"},
				minimalistBadges: 			{save:true, type:"toggle", value:false, label:"Minified badges", id:5, parent:4, example:"minibadges.png"},
				displayTime: 				{save:true, type:"toggle", value:false, label:"Display time", id:6, icon:"timeout_purple.svg"},
				historySize: 				{save:true, type:"slider", value:150, label:"Max chat message count ({VALUE})", min:50, max:500, step:50, id:8},
				defaultSize: 				{save:true, type:"slider", value:2, label:"Default text size ({VALUE})", min:1, max:7, step:1, id:12},
			} as {[key:string]:ParameterData},
			filters: {
				showSelf: 					{save:true, type:"toggle", value:true, label:"Show my messages", id:100},
				keepDeletedMessages: 		{save:true, type:"toggle", value:true, label:"Keep deleted messages", id:113},
				censorDeletedMessages: 		{save:true, type:"toggle", value:true, label:"Censor deleted messages", id:116, parent:113},
				showSlashMe: 				{save:true, type:"toggle", value:true, label:"Show /me messages", id:101},
				showBots: 					{save:true, type:"toggle", value:true, label:"Show known bot's messages", id:102},
				hideUsers: 					{save:true, type:"text", value:"", label:"Hide specific users (coma seperated)", id:103, placeholder:"example: user1, user2, user3", icon:"user_purple.svg", longText:true},
				ignoreCommands: 			{save:true, type:"toggle", value:false, label:"Hide commands (messages starting with \"!\")", id:104, icon:"commands_purple.svg"},
				ignoreListCommands: 		{save:true, type:"toggle", value:false, label:"Block only specific commands", id:114, parent:104},
				blockedCommands: 			{save:true, type:"text", value:"", label:"", placeholder:"example: so, myuptime, ", id:115, parent:114, longText:true},
				showRewards: 				{save:true, type:"toggle", value:true, label:"Show rewards redeemed", id:105, icon:"channelPoints_purple.svg", parent:112},
				showRewardsInfos: 			{save:true, type:"toggle", value:false, label:"Show reward's details", id:110, parent:105, example:"rewardDetails.png"},
				showSubs: 					{save:true, type:"toggle", value:true, label:"Show sub alerts", id:106, icon:"sub_purple.svg", parent:112},
				showCheers: 				{save:true, type:"toggle", value:true, label:"Show bit alerts", id:107, icon:"bits_purple.svg", parent:112},
				showRaids: 					{save:true, type:"toggle", value:true, label:"Show raid alerts", id:108, icon:"raid_purple.svg", parent:112},
				showFollow: 				{save:true, type:"toggle", value:true, label:"Show follow alerts", id:109, icon:"follow_purple.svg", parent:112},
				showHypeTrain: 				{save:true, type:"toggle", value:true, label:"Show hype train alerts", id:111, icon:"train_purple.svg", parent:112},
				showNotifications:	 		{save:true, type:"toggle", value:true, label:"Show notifications on chat (sub,raid,poll,bingo,...)", id:112, icon:"notification_purple.svg", example:"pollPredOnChat.png"},
			} as {[key:string]:ParameterData},
		} as IParameterCategory,

		roomStatusParams: {
			followersOnly:	{ type:"toggle", value:false, label:"Followers only", id:301},
			subsOnly:		{ type:"toggle", value:false, label:"Subs only", id:302},
			emotesOnly:		{ type:"toggle", value:false, label:"Emotes only", id:300},
			slowMode:		{ type:"toggle", value:false, label:"Slow mode", id:303}
		} as IRoomStatusCategory,

		accountParams: {
			syncDataWithServer: { type:"toggle", value:false, label:"Sync parameters to server", id:401 },
			publicDonation: { type:"toggle", value:false, label:"Make my donation public", id:402 },
		} as IAccountParamsCategory,

		confirm:{
			title:"",
			description:"",
			confirmCallback:()=>{ },
			cancelCallback:()=>{ },
			yesLabel:"",
			noLabel:"",
			STTOrigin:false,
		},
		ttsSpeaking: false,
		ttsParams: {
			enabled:false,
			volume:1,
			rate:1,
			pitch:1,
			voice:'',
			maxLength:0,
			maxDuration:30,
			timeout:0,
			removeEmotes:true,
			removeURL:true,
			replaceURL:'link',
			inactivityPeriod:0,
			readMessages:false,
			readMessagePatern:'{USER} says: {MESSAGE}',
			readWhispers:false,
			readWhispersPattern:'{USER} whispers: {MESSAGE}',
			readNotices:false,
			readNoticesPattern:'{MESSAGE}',
			readRewards:false,
			readRewardsPattern:"{USER} redeemed reward {REWARD_NAME}",
			readSubs:false,
			readSubsPattern:"{USER} subscribed at tier {TIER}",
			readSubgifts:false,
			readSubgiftsPattern:"{USER} gifted {COUNT} sub tier {TIER} to {RECIPIENTS}",
			readBits:false,
			readBitsMinAmount:0,
			readBitsPattern:"{USER} sent {BITS} bits",
			readRaids:false,
			readRaidsPattern:"{USER} raided with {VIEWERS} viewers",
			readFollow:false,
			readFollowPattern:"{USER} is now following",
			readPolls:false,
			readPollsPattern:"Poll \"{TITLE}\" ended. Winning choice is, {WINNER}",
			readPredictions:false,
			readPredictionsPattern:"Prediction \"{TITLE}\" ended. Winning choice is, {WINNER}",
			readBingos:false,
			readBingosPattern:"{WINNER} won the bingo",
			readRaffle:false,
			readRafflePattern:"{WINNER} won the raffle",
			ttsPerms:{
				broadcaster:true,
				mods:true,
				vips:true,
				subs:true,
				all:true,
				users:""
			},
		} as TTSParamsData,

		emergencyParams: {
			enabled:false,
			emotesOnly:false,
			subOnly:false,
			followOnly:true,
			noTriggers:false,
			slowMode:false,
			followOnlyDuration:60,
			slowModeDuration:10,
			toUsers:"",
			obsScene:"",
			obsSources:[],
			chatCmd:"",
			chatCmdPerms:{
				broadcaster:true,
				mods:true,
				vips:false,
				subs:false,
				all:false,
				users:""
			},
			autoBlockFollows:false,
			autoUnblockFollows:false,
			autoEnableOnFollowbot:true,
		} as EmergencyParamsData,

		//Stores all the people that followed during an emergency
		emergencyFollows: [] as EmergencyFollowerData[],

		spoilerParams: {
			permissions:{
				broadcaster:true,
				mods:true,
				vips:false,
				subs:false,
				all:false,
				users:""
			},
		} as SpoilerParamsData,

		isChatMessageHighlighted: false,
		chatHighlightOverlayParams: {
			position:"bl",
		} as ChatHighlightOverlayData,
		
		chatAlertParams: {
			chatCmd:"!alert",
			message:true,
			shake:true,
			sound:true,
			blink:false,
			permissions:{
				broadcaster:true,
				mods:true,
				vips:false,
				subs:false,
				all:false,
				users:""
			},
		} as AlertParamsData,
		chatAlert:null as IRCEventDataList.Message|IRCEventDataList.Whisper|null,
		
		musicPlayerParams: {
			autoHide:false,
			erase:true,
			showCover:true,
			showArtist:true,
			showTitle:true,
			showProgressbar:true,
			openFromLeft:false,
			noScroll:false,
			customInfoTemplate:"",
		} as MusicPlayerParamsData,
		
		voicemodCurrentVoice:{
			voiceID: "nofx",
			friendlyName: "clean",
			image:"",
		} as VoicemodTypes.Voice,

		voicemodParams: {
			enabled:false,
			voiceIndicator:true,
			commandToVoiceID:{},
			chatCmdPerms:{
				broadcaster:true,
				mods:true,
				vips:false,
				subs:false,
				all:false,
				users:""
			},
		} as VoicemodParamsData,

		automodParams: {
			enabled:false,
			banUserNames:false,
			keywordsFilters:[],
			exludedUsers:{
				broadcaster:true,
				mods:true,
				vips:true,
				subs:false,
				all:false,
				users:""
			},
		} as AutomodParamsData,
	},














	mutations: {
		async authenticate(state, payload) {
			const code = payload.code;
			const cb = payload.cb;
			const forceRefresh = payload.forceRefresh;
			try {

				let json:TwitchDataTypes.AuthTokenResult;
				if(code) {
					const res = await fetch(Config.instance.API_PATH+"/gettoken?code="+code, {method:"GET"});
					json = await res.json();
				}else {
					json = JSON.parse(Store.get(Store.TWITCH_AUTH_TOKEN));
					//Refresh token if going to expire within the next 5 minutes
					if(json && (forceRefresh || json.expires_at < Date.now() - 60000*5)) {
						const res = await fetch(Config.instance.API_PATH+"/refreshtoken?token="+json.refresh_token, {method:"GET"});
						json = await res.json();
					}
				}
				if(!json) {
					console.log("No JSON :(", json);
					if(cb) cb(false);
					return;
				}
				//Validate auth token
				const userRes = await TwitchUtils.validateToken(json.access_token);
				const status = (userRes as TwitchDataTypes.Error).status;
				if(isNaN((userRes as TwitchDataTypes.Token).expires_in)
				&& status != 200) throw("invalid token");

				UserSession.instance.access_token = json.access_token;
				UserSession.instance.authToken = userRes as TwitchDataTypes.Token;
				//Check if all scopes are allowed
				for (let i = 0; i < Config.instance.TWITCH_APP_SCOPES.length; i++) {
					if(UserSession.instance.authToken.scopes.indexOf(Config.instance.TWITCH_APP_SCOPES[i]) == -1) {
						console.log("Missing scope:", Config.instance.TWITCH_APP_SCOPES[i]);
						state.authenticated = false;
						UserSession.instance.authResult = null;
						state.newScopeToRequest.push(Config.instance.TWITCH_APP_SCOPES[i]);
					}
				}
				if(state.newScopeToRequest.length > 0) {
					if(cb) cb(false);
					return;
				}
				if(!json.expires_at) {
					json.expires_at = Date.now() + UserSession.instance.authToken.expires_in*1000;
				}
				UserSession.instance.authResult = json;
				Store.access_token = json.access_token;
				Store.set(Store.TWITCH_AUTH_TOKEN, json, false);
				
				//Check if user is part of the donors
				try {
					const options = {
						method: "GET",
						headers: {
							"Content-Type": "application/json",
							"Authorization": "Bearer "+UserSession.instance.access_token as string,
						},
					}
					const donorRes = await fetch(Config.instance.API_PATH+"/user/donor", options);
					const donorJSON = await donorRes.json();
					UserSession.instance.isDonor = donorJSON.data?.isDonor === true;
					UserSession.instance.donorLevel = donorJSON.data?.level;
				}catch(error) {}

				//Get full user's info
				const users = await TwitchUtils.loadUserInfo([UserSession.instance.authToken.user_id]);
				const currentUser = users.find(v => v.id == UserSession.instance.authToken.user_id);
				if(currentUser) {
					state.hasChannelPoints = currentUser.broadcaster_type != "";
					UserSession.instance.user = currentUser;
				}
				
				if(state.authenticated) {
					//If we were authenticated, simply update the token on IRC
					IRCClient.instance.updateToken(json.access_token);
				}else{
					IRCClient.instance.connect(UserSession.instance.authToken.login, UserSession.instance.access_token as string);
					PubSub.instance.connect();
				}
				state.authenticated = true;
				state.mods = await TwitchUtils.getModerators();
				state.followingStates[UserSession.instance.authToken.user_id] = true;
				state.followingStatesByNames[UserSession.instance.authToken.login.toLowerCase()] = true;
				if(cb) cb(true);

				const expire = UserSession.instance.authToken.expires_in;
				let delay = Math.max(0, expire*1000 - 60000 * 5);//Refresh 5min before it actually expires
				//Refresh at least every 3h
				const maxDelay = 1000 * 60 * 60 * 3;
				if(delay > maxDelay) delay = maxDelay;
			
				console.log("Refresh token in", Utils.formatDuration(delay));
				clearTimeout(state.refreshTokenTO);
				state.refreshTokenTO = setTimeout(()=>{
					store.dispatch("authenticate", {forceRefresh:true});
				}, delay);
				
			}catch(error) {
				console.log(error);
				state.authenticated = false;
				Store.remove("oAuthToken");
				state.alert = "Authentication failed";
				if(cb) cb(false);
				router.push({name: 'login'});//Redirect to login if connection failed
			}
		},

		logout(state) {
			UserSession.instance.authResult = null;
			state.authenticated = false;
			Store.remove("oAuthToken");
			IRCClient.instance.disconnect();
		},

		confirm(state, payload) { state.confirm = payload; },

		sendTwitchatAd(state, contentID:TwitchatAdStringTypes = -1) {
			if(contentID == -1) {
				let possibleAds:TwitchatAdStringTypes[] = [];
				if(!UserSession.instance.isDonor || UserSession.instance.donorLevel < 2) {
					possibleAds.push(TwitchatAdTypes.SPONSOR);
				}
				//Give more chances to hae anything but the "sponsor" ad
				possibleAds.push(TwitchatAdTypes.TIP_AND_TRICK);
				possibleAds.push(TwitchatAdTypes.TIP_AND_TRICK);
				possibleAds.push(TwitchatAdTypes.TIP_AND_TRICK);
				possibleAds.push(TwitchatAdTypes.DISCORD);
				possibleAds.push(TwitchatAdTypes.DISCORD);
				possibleAds.push(TwitchatAdTypes.DISCORD);

				const lastUpdateRead = parseInt(Store.get(Store.UPDATE_INDEX));
				if(isNaN(lastUpdateRead) || lastUpdateRead < state.latestUpdateIndex) {
					//Force last updates if any not read
					possibleAds = [TwitchatAdTypes.UPDATES];
				}else{
					//Add 2 empty slots for every content type available
					//to reduce chances to actually get an "ad"
					const len = 2*possibleAds.length;
					for (let i = 0; i < len; i++) possibleAds.push(-1);
				}
		
				contentID = Utils.pickRand(possibleAds);
				// contentID = TwitchatAdTypes.UPDATES;//TODO comment this line
				if(contentID == -1) return;
			}

			const list = state.chatMessages.concat();
			list .push( {
				type:"ad",
				channel:"#"+UserSession.instance.authToken.login,
				markedAsRead:false,
				contentID,
				tags:{id:"twitchatAd"+Math.random()}
			} );
			state.chatMessages = list;
		},

		openTooltip(state, payload) { state.tooltip = payload; },
		
		closeTooltip(state) { state.tooltip = ""; },
		
		showParams(state, payload) { state.showParams = payload; },

		openUserCard(state, payload) { state.userCard = payload; },
		
		async addChatMessage(state, payload:IRCEventData) {
			let messages = state.chatMessages.concat() as (IRCEventDataList.Message|IRCEventDataList.Highlight|IRCEventDataList.Whisper)[];
			
			const message = payload as IRCEventDataList.Message|IRCEventDataList.Highlight|IRCEventDataList.Whisper
			const uid:string|undefined = message?.tags['user-id'];
			const messageStr = message.type == "whisper"? message.params[1] : message.message;
			const wsMessage = {
				channel:message.channel,
				message:messageStr as string,
				tags:message.tags,
			}

			//Limit history size
			// const maxMessages = state.params.appearance.historySize.value;
			const maxMessages = state.realHistorySize;
			if(messages.length >= maxMessages) {
				messages = messages.slice(-maxMessages);
				state.chatMessages = messages;
			}

			if(payload.type == "notice") {
				if((payload as IRCEventDataList.Notice).msgid == "usage_host") {
					const raids = (messages as IRCEventDataList.Highlight[]).filter(v => v.viewers != undefined);
					for (let i = 0; i < raids.length; i++) {
						if(raids[i].username?.toLowerCase() == (payload as IRCEventDataList.Notice).username?.toLowerCase()) {
							console.log("Already raided ! Ignore host event");
							return;
						}
					}
				}
			}else{
				
				const textMessage = payload as IRCEventDataList.Message;

				//If it's a subgift, merge it with potential previous ones
				if(payload.type == "highlight" && payload.recipient) {
					for (let i = 0; i < messages.length; i++) {
						const m = messages[i];
						if(m.type != "highlight") continue;
						//If the message is a subgift from the same user and happened
						//in the last 5s, merge it.
						if(m.methods?.plan && m.tags.login == payload.tags.login
						&& Date.now() - parseInt(m.tags['tmi-sent-ts'] as string) < 5000) {
							if(!m.subgiftAdditionalRecipents) m.subgiftAdditionalRecipents = [];
							m.tags['tmi-sent-ts'] = Date.now().toString();//Update timestamp
							m.subgiftAdditionalRecipents.push(payload.recipient as string);
							return;
						}
					}
				}

				//If it's a subgift, merge it with potential previous ones
				if(payload.type == "highlight" && payload.tags["msg-id"] == "raid") {
					state.lastRaiderLogin = payload.username as string;
				}

				//Search in the last 50 messages if this message has already been sent
				//If so, just increment the previous one
				if(state.params.features.groupIdenticalMessage.value === true) {
					const len = messages.length;
					const end = Math.max(0, len - 50);
					for (let i = len-1; i > end; i--) {
						const mess = messages[i];
						const messageStr = mess.type == "whisper"? mess.params[1] : mess.message;
						if(mess.type == "message"
						&& uid == mess.tags['user-id']
						&& (parseInt(mess.tags['tmi-sent-ts'] as string) > Date.now() - 30000 || i > len-20)//"i > len-20" more or less means "if message is still visible on screen"
						&& textMessage.message == messageStr) {
							if(!mess.occurrenceCount) mess.occurrenceCount = 0;
							mess.occurrenceCount ++;
							mess.tags['tmi-sent-ts'] = Date.now().toString();//Update timestamp
							messages.splice(i, 1);
							messages.push(mess);
							state.chatMessages = messages;	
							return;
						}
					}
				}
				
				//Check if user is following
				if(state.params.appearance.highlightNonFollowers.value === true) {
					if(uid && state.followingStates[uid] == undefined) {
						TwitchUtils.getFollowState(uid, textMessage.tags['room-id']).then((res:boolean) => {
							state.followingStates[uid] = res;
							state.followingStatesByNames[message.tags.username?.toLowerCase()] = res;
						}).catch(()=>{/*ignore*/})
					}
				}

				//If it's a follow event, flag user as a follower
				if(payload.type == "highlight") {
					if(payload.tags['msg-id'] == "follow") {
						state.followingStates[payload.tags['user-id'] as string] = true;
						state.followingStatesByNames[message.tags.username?.toLowerCase()] = true;
					}
				}
				
				//Check for user's pronouns
				if(state.params.features.showUserPronouns.value === true) {
					if(uid && state.userPronouns[uid] == undefined && textMessage.tags.username) {
						TwitchUtils.getPronouns(uid, textMessage.tags.username).then((res: TwitchDataTypes.Pronoun | null) => {
							if (res !== null) {
								state.userPronouns[uid] = res.pronoun_id;
							}else{
								state.userPronouns[uid] = false;
							}
								
						}).catch(()=>{/*ignore*/})
					}
				}
				
				//Custom secret feature hehehe ( ͡~ ͜ʖ ͡°)
				if(TwitchCypherPlugin.instance.isCyperCandidate(textMessage.message)) {
					const original = textMessage.message;
					textMessage.message = await TwitchCypherPlugin.instance.decrypt(textMessage.message);
					textMessage.cyphered = textMessage.message != original;
				}
				
				//If message is an answer, set original message's ref to the answer
				//Called when using the "answer feature" on twitch chat
				if(textMessage.tags && textMessage.tags["reply-parent-msg-id"]) {
					let original:IRCEventDataList.Message | null = null;
					const reply:IRCEventDataList.Message | null = textMessage;
					//Search for original message the user answered to
					for (let i = 0; i < messages.length; i++) {
						const c = messages[i] as IRCEventDataList.Message;
						if(c.tags.id === textMessage.tags["reply-parent-msg-id"]) {
							original = c;
							break;
						}
					}
	
					if(reply && original) {
						if(original.answerTo) {
							reply.answerTo = original.answerTo;
							if(original.answerTo.answers) {
								original.answerTo.answers.push( textMessage );
							}
						}else{
							reply.answerTo = original;
							if(!original.answers) original.answers = [];
							original.answers.push( textMessage );
						}
					}
				}else{
					//If there's a mention, search for last messages within
					//a max timeframe to find if the message may be a reply to
					//a message that was sent by the mentionned user
					if(/@\w/gi.test(textMessage.message)) {
						// console.log("Mention found");
						const ts = Date.now();
						const timeframe = 5*60*1000;//Check if a massage answers another within this timeframe
						const matches = textMessage.message.match(/@\w+/gi) as RegExpMatchArray;
						for (let i = 0; i < matches.length; i++) {
							const match = matches[i].replace("@", "").toLowerCase();
							// console.log("Search for message from ", match);
							const candidates = messages.filter(m => m.tags.username == match);
							//Search for oldest matching candidate
							for (let j = 0; j < candidates.length; j++) {
								const c = candidates[j] as IRCEventDataList.Message;
								// console.log("Found candidate", c);
								if(ts - parseInt(c.tags['tmi-sent-ts'] as string) < timeframe) {
									// console.log("Timeframe is OK !");
									if(c.answers) {
										//If it's the root message of a conversation
										c.answers.push( textMessage );
										textMessage.answerTo = c;
									}else if(c.answerTo && c.answerTo.answers) {
										//If the messages answers to a message itself answering to another message
										c.answerTo.answers.push( textMessage );
										textMessage.answerTo = c.answerTo;
									}else{
										//If message answers to a message not from a conversation
										textMessage.answerTo = c;
										if(!c.answers) c.answers = [];
										c.answers.push( textMessage );
									}
									break;
								}
							}
						}
					}
				}

				//If it's a text message and user isn't a follower, broadcast to WS
				if(payload.type == "message" && uid) {
					if(state.followingStates[uid] === false) {
						PublicAPI.instance.broadcast(TwitchatEvent.MESSAGE_NON_FOLLOWER, {message:wsMessage});
					}
				}

				//Check if the message contains a mention
				if(textMessage.message && state.params.appearance.highlightMentions.value === true) {
					textMessage.hasMention = UserSession.instance.authToken.login != null
					&& new RegExp("(^| |@)("+UserSession.instance.authToken.login.toLowerCase()+")($|\\s)", "gim").test(textMessage.message.toLowerCase());
					if(textMessage.hasMention) {
						//Broadcast to OBS-Ws
						PublicAPI.instance.broadcast(TwitchatEvent.MENTION, {message:wsMessage});
					}
				}
			}

			//If it's a text message and user isn't a follower, broadcast to WS
			if(message.firstMessage === true)		PublicAPI.instance.broadcast(TwitchatEvent.MESSAGE_FIRST, {message:wsMessage});
			//If it's a text message and it's the all-time first message
			if(message.tags['first-msg'] === true)	PublicAPI.instance.broadcast(TwitchatEvent.MESSAGE_FIRST_ALL_TIME, {message:wsMessage});

			const elevated = typeof message.tags["pinned-chat-paid-canonical-amount"] == "number";
			// if(elevated) {
			// 	state.elevatedMessages.push(payload);
			// }

			//Push some messages to activity feed
			if(payload.type == "highlight"
			|| payload.type == "poll"
			|| payload.type == "prediction"
			|| payload.type == "bingo"
			|| payload.type == "raffle"
			|| payload.type == "countdown"
			|| payload.type == "hype_train_end"
			|| (
				state.params.features.keepHighlightMyMessages.value === true
				&& payload.type == "message"
				&& (payload as IRCEventDataList.Message).tags["msg-id"] === "highlighted-message"
			)
			|| (
				payload.type == "message" && elevated
			)
			|| (payload as IRCEventDataList.Commercial).tags["msg-id"] === "commercial") {
				state.activityFeed.push(payload as ActivityFeedData);
			}

			messages.push( message );
			state.chatMessages = messages;
		},
		
		delChatMessage(state, data:{messageId:string, deleteData:PubSubDataTypes.DeletedMessage}) { 
			const keepDeletedMessages = state.params.filters.keepDeletedMessages.value;
			const list = (state.chatMessages.concat() as (IRCEventDataList.Message | IRCEventDataList.TwitchatAd)[]);
			for (let i = 0; i < list.length; i++) {
				const m = list[i];
				if(data.messageId == m.tags.id) {
					if(m.type == "ad") {
						//Called if closing an ad
						list.splice(i, 1);
					}else{
						//Broadcast to OBS-ws
						const wsMessage = {
							channel:m.channel,
							message:m.message,
							tags:m.tags,
						}
						PublicAPI.instance.broadcast(TwitchatEvent.MESSAGE_DELETED, {message:wsMessage});
	
						if(keepDeletedMessages === true && !m.automod) {
							//Just flag as deleted so its render is faded
							m.deleted = true;
							m.deletedData = data.deleteData;
						}else{
							//Remove message from list
							list.splice(i, 1);
						}
					}
					break;
				}
			}
			state.chatMessages = list;
		},

		delUserMessages(state, username:string) {
			username = username.toLowerCase()
			const keepDeletedMessages = state.params.filters.keepDeletedMessages.value;
			const list = (state.chatMessages.concat() as IRCEventDataList.Message[]);
			for (let i = 0; i < list.length; i++) {
				const m = list[i];
				if(m.tags.username?.toLowerCase() == username && m.type == "message") {
					//Broadcast to OBS-ws
					const wsMessage = {
						channel:list[i].channel,
						message:list[i].message,
						tags:list[i].tags,
					}
					PublicAPI.instance.broadcast(TwitchatEvent.MESSAGE_DELETED, {message:wsMessage});

					//Delete message from list
					if(keepDeletedMessages === true) {
						list[i].deleted = true;
					}else{
						list.splice(i, 1);
						i--;
					}
				}
			}
			state.chatMessages = list;
		},

		updateParams(state) {
			// const key = payload.key as "firstMessage";
			// state.params[key] = payload.value;
			for (const cat in state.params) {
				const c = cat as ParameterCategory;
				for (const key in state.params[c]) {
					/* eslint-disable-next-line */
					const v = state.params[c][key as ParameterCategory].value;
					Store.set("p:"+key, v);
					if(key=="bttvEmotes") {
						if(v === true) {
							BTTVUtils.instance.enable();
						}else{
							BTTVUtils.instance.disable();
						}
					}
					if(key=="ffzEmotes") {
						if(v === true) {
							FFZUtils.instance.enable();
						}else{
							FFZUtils.instance.disable();
						}
					}
					if(key=="sevenTVEmotes") {
						if(v === true) {
							SevenTVUtils.instance.enable();
						}else{
							SevenTVUtils.instance.disable();
						}
					}
				}
			}
		},
		
		setCypherKey(state, payload:string) {
			state.cypherKey = payload;
			TwitchCypherPlugin.instance.cypherKey = payload;
			Store.set(Store.CYPHER_KEY, payload);
		},

		setCypherEnabled(state, payload:boolean) { state.cypherEnabled = payload; },

		setUserState(state, payload:UserNoticeState) { state.tmiUserState = payload; },

		setEmotes(state, payload:TwitchDataTypes.Emote[]) { UserSession.instance.emotesCache = payload; },

		setEmoteSelectorCache(state, payload:{user:TwitchDataTypes.UserInfo, emotes:TwitchDataTypes.Emote[]}[]) { state.emoteSelectorCache = payload; },

		trackUser(state, payload:IRCEventDataList.Message) {
			const list = state.trackedUsers as TrackedUser[];
			const index = list.findIndex(v=>v.user['user-id'] == payload.tags['user-id']);
			if(index == -1) {
				//Was not tracked, track the user
				state.trackedUsers.push({user:payload.tags, messages:[payload]});
			}else{
				//User was already tracked, untrack her/him
				list.splice(index,1);
			}
		},

		untrackUser(state, payload:ChatUserstate) {
			const list = state.trackedUsers as TrackedUser[];
			const index = list.findIndex(v=>v.user['user-id'] == payload['user-id']);
			if(index != -1) {
				state.trackedUsers.splice(index, 1);
			}
		},

		ttsReadMessage(state, payload:IRCEventDataList.Message) {
			TTSUtils.instance.readNow(payload.message);
		},

		ttsReadUser(state, payload:{username:string, read:boolean}) {
			let list = state.ttsParams.ttsPerms.users.toLowerCase().split(/[^a-zA-ZÀ-ÖØ-öø-ÿ0-9_]+/gi);
			payload.username = payload.username.toLowerCase().replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ0-9_]+/gi, "").trim();
			const index = list.indexOf(payload.username)
			if(index > -1) {
				if(!payload.read) list.splice(index, 1);
			}else if(payload.read){
				list.push(payload.username);
			}
			list = list.filter(v => v.trim().length > 2);
			state.ttsParams.ttsPerms.users = list.join(",");
			if(payload.read) {
				IRCClient.instance.sendNotice("tts", "User <mark>"+payload.username+"</mark>'s messages will be read out loud.");
			}else{
				IRCClient.instance.sendNotice("tts", "User <mark>"+payload.username+"</mark>'s messages will not be read out loud anymore.");
			}
		},
		
		setChatPoll(state, payload:ChatPollData) { state.chatPoll = payload; },

		async startRaffle(state, payload:RaffleData) {
			state.raffle = payload;
			
			let overlayAvailable = false;
			const callback = (e:TwitchatEvent) => {overlayAvailable = true;}
			PublicAPI.instance.addEventListener(TwitchatEvent.WHEEL_OVERLAY_PRESENCE, callback);
			
			//Ask if the wheel overlay exists
			PublicAPI.instance.broadcast(TwitchatEvent.GET_WHEEL_OVERLAY_PRESENCE);
			await Utils.promisedTimeout(1000);//Give the overlay some time to answer
			PublicAPI.instance.removeEventListener(TwitchatEvent.WHEEL_OVERLAY_PRESENCE, callback);
			
			switch(payload.mode) {
				case "chat": {
					//Start countdown if requested
					if(payload.showCountdownOverlay) {
						store.dispatch("startCountdown", payload.duration * 1000 * 60);
					}
					//Announce start on chat
					if(state.botMessages.raffleStart.enabled) {
						let message = state.botMessages.raffleStart.message;
						message = message.replace(/\{CMD\}/gi, payload.command);
						IRCClient.instance.sendMessage(message);
					}
					break;
				}

				case "sub": {
					const idToExists:{[key:string]:boolean} = {};
					let subs = await TwitchUtils.getSubsList();
					subs = subs.filter(v => {
						//Avoid duplicates
						if(idToExists[v.user_id] == true) return false;
						if(idToExists[v.gifter_id] == true && v.gifter_id) return false;
						idToExists[v.user_id] = true;
						idToExists[v.gifter_id] = true;
						//Filter based on params
						if(payload.subMode_includeGifters == true && subs.find(v2=> v2.gifter_id == v.user_id)) return true;
						if(payload.subMode_excludeGifted == true && v.is_gift) return false;
						if(v.user_id == v.broadcaster_id) return false;//Exclude self
						return true;
					});
					
					const items:RaffleEntry[] = subs.map(v=>{
						return {
							id:v.user_id,
							label:v.user_name,
							score:1,
						}
					});
					state.raffle.entries = items;
					
					if(overlayAvailable) {
						//A wheel overlay exists, ask it to animate
						const winner = Utils.pickRand(items).id;
						const data:{items:WheelItem[], winner:string} = { items, winner };
						PublicAPI.instance.broadcast(TwitchatEvent.WHEEL_OVERLAY_START, (data as unknown) as JsonObject);
					}else{
						//No wheel overlay found, announce on chat
						const winner:WheelItem = Utils.pickRand(items);
						store.dispatch("onRaffleComplete", {publish:true, winner});
					}
					break;
				}

				case "manual": {
					let id = 0;
					let customEntries:string[] = [];
					let customEntriesStr = payload.customEntries;
					if(customEntriesStr?.length > 0) {
						const splitter = customEntriesStr.split(/\r|\n/).length > 1? "\r|\n" : ",";
						customEntries = customEntriesStr.split(new RegExp(splitter, ""));
						customEntries = customEntries.map(v=> v.trim());
					}else{
						customEntries = ["invalid custom entries"];
					}
					const items:RaffleEntry[] = customEntries.map(v=> {
						return {
							id:(id++).toString(),
							label:v,
							score:1,
						}
					});
					state.raffle.entries = items;
					
					if(overlayAvailable) {
						//A wheel overlay exists, ask it to animate
						const winner = Utils.pickRand(items).id;
						const data:{items:WheelItem[], winner:string} = { items, winner };
						PublicAPI.instance.broadcast(TwitchatEvent.WHEEL_OVERLAY_START, (data as unknown) as JsonObject);
					}else{
						//No wheel overlay found, announce on chat
						const winner:WheelItem = Utils.pickRand(items);
						store.dispatch("onRaffleComplete", {publish:true, winner});
					}
					break;
				}
			}
		},

		stopRaffle(state) { state.raffle = null; },

		onRaffleComplete(state, payload:{publish:boolean, winner:WheelItem}) {
			// state.raffle = null;
			if(!state.raffle) return;
			const winner = state.raffle.entries.find(v=> v.id == payload.winner.id);
			if(!winner) return;

			if(!state.raffle.winners) state.raffle.winners = [];
			state.raffle.winners.push(winner);
			
			//Execute triggers
			const message:IRCEventDataList.RaffleResult = {
				type:"raffle",
				data:state.raffle as RaffleData,
				winner,
				tags:IRCClient.instance.getFakeTags(),
			}
			TriggerActionHandler.instance.onMessage(message);
			store.dispatch("addChatMessage", message);

			//Post result on chat
			if(state.botMessages.raffle.enabled) {
				let message = state.botMessages.raffle.message;
				let label = payload.winner.label;
				message = message.replace(/\{USER\}/gi, label);
				IRCClient.instance.sendMessage(message);
			}

			//Publish the result on the public API
			if(payload.publish !== false) {
				PublicAPI.instance.broadcast(TwitchatEvent.RAFFLE_COMPLETE, (payload.winner as unknown) as JsonObject);
			}
		},

		async startBingo(state, payload:BingoConfig) {
			const min = payload.min as number;
			const max = payload.max as number;
			
			let emotes = await TwitchUtils.getEmotes();
			emotes = emotes.filter(v => v.emote_type == "globals");

			const data:BingoData = {
				guessNumber: payload.guessNumber,
				guessEmote: payload.guessEmote,
				numberValue: Math.round(Math.random() * (max-min) + min),
				emoteValue: Utils.pickRand(emotes),
				winners: [],
			};
			state.bingo = data;
			
			if(state.botMessages.bingoStart.enabled) {
				let message = state.botMessages.bingoStart.message;
				let goal = "Find ";
				if(payload.guessEmote) {
					goal += " one of the global Twitch emotes";
				}else{
					goal += " a number between "+min+" and "+max+" included";
				}
				message = message.replace(/\{GOAL\}/gi, goal as string);
				IRCClient.instance.sendMessage(message);
			}
		},

		stopBingo(state) { state.bingo = null; },

		closeWhispers(state, userID:string) {
			const whispers = state.whispers as {[key:string]:IRCEventDataList.Whisper[]};
			delete whispers[userID];
			state.whispers = whispers;
		},

		setRaiding(state, infos:PubSubDataTypes.RaidInfos) { state.raiding = infos; },

		setViewersList(state, users:string[]) {
			//Dedupe users
			const list:string[] = [];
			const done:{[key:string]:boolean} = {};
			for (let i = 0; i < users.length; i++) {
				const user = users[i];
				if(!done[user]) {
					list.push(user);
					done[user] = true;
				}
			}
			state.onlineUsers.splice(0, state.onlineUsers.length);//cleanup prev users
			state.onlineUsers = state.onlineUsers.concat(list);//Add new users
			//Don't just do "state.onlineUsers = users" or the arrays's reference/reactivity
			//accross the app would be broken
		},
		
		toggleDevMode(state, forcedState?:boolean) {
			let notify = true;
			if(forcedState !== undefined) {
				state.devmode = forcedState;
				notify = forcedState
			}else{
				state.devmode = !state.devmode;
			}
			if(state.devmode != JSON.parse(Store.get(Store.DEVMODE))) {
				Store.set(Store.DEVMODE, state.devmode);
			}
			if(notify) {
				IRCClient.instance.sendNotice("devmode", "Developer mode "+(state.devmode?"enabled":"disabled"));
			}
		},

		setHypeTrain(state, data:HypeTrainStateData) {
			state.hypeTrain = data;
			if(data.state == "COMPLETED" && data.approached_at) {
				const threshold = 5*60*1000;
				const offset = data.approached_at;
				const activities:ActivityFeedData[] = [];
				for (let i = 0; i < state.activityFeed.length; i++) {
					const el = state.activityFeed[i];
					if(!el.tags['tmi-sent-ts']) continue;
					let timestamp = el.tags['tmi-sent-ts'];
					//If receiving a timestamp, convert it to number as the Date constructor
					//accept either a number or a fully formated date/time string but not
					//a timestamp string
					const ts = parseInt(timestamp).toString() == timestamp? parseInt(timestamp) : timestamp;
					const date = new Date(ts).getTime();
					const type = getTwitchatMessageType(el);
					if(type == TwitchatMessageType.BITS
					|| type == TwitchatMessageType.SUB
					|| type == TwitchatMessageType.SUB_PRIME
					|| type == TwitchatMessageType.SUBGIFT
					|| type == TwitchatMessageType.SUBGIFT_UPGRADE) {
						if(date > offset - threshold) {
							activities.push( el );
						}
					}
				}
				
				if(activities.length > 0) {
					const res:IRCEventDataList.HypeTrainResult = {
						type:"hype_train_end",
						train:data,
						activities,
						tags: {
							id:IRCClient.instance.getFakeGuid(),
							"tmi-sent-ts": Date.now().toString()
						},
					}
					store.dispatch("addChatMessage", res);
				}
			}
		},

		flagLowTrustMessage(state, payload:{data:PubSubDataTypes.LowTrustMessage, retryCount?:number}) {
			//Ignore message if user is "restricted"
			if(payload.data.low_trust_user.treatment == 'RESTRICTED') return;

			const list = (state.chatMessages.concat() as IRCEventDataList.Message[]);
			for (let i = 0; i < list.length; i++) {
				const m = list[i];
				if(m.tags.id == payload.data.message_id) {
					list[i].lowTrust = true;
					return;
				}
			}

			//If reaching this point, it's most probably because pubsub sent us the
			//event before receiving message on IRC. Wait a little and try again
			if(payload.retryCount != 20) {
				payload.retryCount = payload.retryCount? payload.retryCount++ : 1;
				setTimeout(()=>{
					store.commit("flagLowTrustMessage", payload);
				}, 100);
			}
		},

		canSplitView(state, value:boolean) { state.canSplitView = value; },

		searchMessages(state, value:string) { state.searchMessages = value; },

		setPlaybackState(state, value:PubSubDataTypes.PlaybackInfo) { state.playbackState = value; },

		setCommunityBoost(state, value:PubSubDataTypes.CommunityBoost) { state.communityBoostState = value; },

		setOBSSceneCommands(state, value:OBSSceneCommand[]) {
			state.obsSceneCommands = value;
			Store.set(Store.OBS_CONF_SCENES, value);
		},

		setOBSMuteUnmuteCommands(state, value:OBSMuteUnmuteCommands) {
			state.obsMuteUnmuteCommands = value;
			Store.set(Store.OBS_CONF_MUTE_UNMUTE, value);
		},

		setObsCommandsPermissions(state, value:PermissionsData) {
			state.obsCommandsPermissions = value;
			Store.set(Store.OBS_CONF_PERMISSIONS, value);
		},

		setTrigger(state, value:{key:string, data:TriggerData}) {
			if(!value.key) return;
			value.key = value.key.toLowerCase();

			//remove incomplete entries
			function cleanEmptyActions(actions:TriggerActionTypes[]):TriggerActionTypes[] {
				return actions.filter(v=> {
					if(v.type == null) return false;
					if(v.type == "obs") return true;//v.sourceName?.length > 0;
					if(v.type == "chat") return true;//v.text?.length > 0;
					if(v.type == "music") return true;
					if(v.type == "tts") return true;
					if(v.type == "raffle") return true;
					if(v.type == "bingo") return true;
					if(v.type == "voicemod") return true;
					if(v.type == "highlight") return true;
					if(v.type == "trigger") return true;
					//@ts-ignore
					console.warn("Trigger action type not whitelisted on store : "+v.type);
					return false;
				})

			}
			let remove = false;
			//Chat command specifics
			if(value.key.indexOf(TriggerTypes.CHAT_COMMAND+"_") === 0
			|| value.key.indexOf(TriggerTypes.SCHEDULE+"_") === 0) {
				if(value.data.name) {
					//If name has been changed, cleanup the previous one from storage
					if(value.data.prevKey) {
						delete state.triggers[value.data.prevKey.toLowerCase()];
						//Update trigger dependencies if any is pointing
						//to the old trigger's name
						for (const key in state.triggers) {
							if(key == value.key) continue;
							const t = state.triggers[key];
							for (let i = 0; i < t.actions.length; i++) {
								const a = t.actions[i];
								if(a.type == "trigger") {
									//Found a trigger dep' pointing to the old trigger's name,
									//update it with the new name
									if(a.triggerKey === value.data.prevKey) {
										a.triggerKey = value.key;
									}
								}
							}
						}
						//If it is a schedule
						if(value.key.split("_")[0] === TriggerTypes.SCHEDULE) {
							//Remove old one from scheduling
							SchedulerHelper.instance.unscheduleTrigger(value.data.prevKey);
						}
						delete value.data.prevKey;
					}
					// if(value.data.actions.length == 0) remove = true;
				}else{
					//Name not defined, don't save it
					delete state.triggers[value.key.toLowerCase()];
					return;
				}
			}else{
				if(value.data.actions.length == 0) remove = true;
			}
			if(remove) {
				delete state.triggers[value.key.toLowerCase()];
			}else{
				value.data.actions = cleanEmptyActions(value.data.actions);
				state.triggers[value.key.toLowerCase()] = value.data;
			}

			//If it is a schedule trigger add it to the scheduler
			if(value.key.split("_")[0] === TriggerTypes.SCHEDULE) {
				SchedulerHelper.instance.scheduleTrigger(value.key, value.data.scheduleParams!);
			}

			Store.set(Store.TRIGGERS, state.triggers);
			TriggerActionHandler.instance.triggers = state.triggers;
		},

		deleteTrigger(state, key:string) {
			key = key.toLowerCase();
			if(state.triggers[key]) {
				delete state.triggers[key];
				Store.set(Store.TRIGGERS, state.triggers);
			}
		},

		updateBotMessage(state, value:{key:BotMessageField, enabled:boolean, message:string}) {
			state.botMessages[value.key].enabled = value.enabled;
			state.botMessages[value.key].message = value.message;
			Store.set(Store.BOT_MESSAGES, state.botMessages);
		},

		setVoiceLang(state, value:string) {
			state.voiceLang = value
			Store.set("voiceLang", value);
		},

		setVoiceActions(state, value:VoiceAction[]) {
			state.voiceActions = value;
			Store.set("voiceActions", value);
		},

		ahsInstaller(state, value:InstallHandler) { state.ahsInstaller = value; },

		setSpotifyCredentials(state, value:{client:string, secret:string}) {
			Store.set(Store.SPOTIFY_APP_PARAMS, value);
			SpotifyHelper.instance.setAppParams(value.client, value.secret)
		},

		setSpotifyAuthResult(state, value:SpotifyAuthResult) { state.spotifyAuthParams = value; },
		
		setSpotifyToken(state, value:SpotifyAuthToken|null) {
			if(value && !value.expires_at) {
				value.expires_at = Date.now() + value.expires_in * 1000;
			}
			if(!value || !value.refresh_token) {
				value = null;
				Store.remove("spotifyAuthToken");
			}else{
				Store.set(Store.SPOTIFY_AUTH_TOKEN, value);
			}
			state.spotifyAuthToken = value;
			SpotifyHelper.instance.token = value;
			Config.instance.SPOTIFY_CONNECTED = value? value.expires_at > Date.now() : false;
			if(value) {
				SpotifyHelper.instance.getCurrentTrack();
			}
		},

		setDeezerConnected(state, value:boolean) {
			state.deezerConnected = value;
			Config.instance.DEEZER_CONNECTED = value;
			if(!value) {
				DeezerHelper.instance.dispose();
			}
		},
		
		setCommercialEnd(state, date:number) { state.commercialEnd = date; },
		

		async shoutout(state, username:string) {
			username = username.trim().replace(/^@/gi, "");
			const userInfos = await TwitchUtils.loadUserInfo(undefined, [username]);
			if(userInfos?.length > 0) {
				const channelInfo = await TwitchUtils.loadChannelInfo([userInfos[0].id]);
				let message = state.botMessages.shoutout.message
				let streamTitle = channelInfo[0].title;
				let category = channelInfo[0].game_name;
				if(!streamTitle) streamTitle = "no stream found"
				if(!category) category = "no stream found"
				message = message.replace(/\{USER\}/gi, userInfos[0].display_name);
				message = message.replace(/\{URL\}/gi, "twitch.tv/"+userInfos[0].login);
				message = message.replace(/\{TITLE\}/gi, streamTitle);
				message = message.replace(/\{CATEGORY\}/gi, category);
				await IRCClient.instance.sendMessage(message);
				
				const trigger:ShoutoutTriggerData = {
					type: "shoutout",
					user:userInfos[0],
					stream:channelInfo[0],
				};
				TriggerActionHandler.instance.onMessage(trigger)
			}else{
				//Warn user doesn't exist
				state.alert = "User "+username+" doesn't exist.";
			}
		},

		saveStreamInfoPreset(state, preset:StreamInfoPreset) {
			const index = state.streamInfoPreset.findIndex(v=> v.id == preset.id);
			if(index > -1) {
				//update existing preset
				state.streamInfoPreset[index] = preset;
			}else{
				//add new preset
				state.streamInfoPreset.push(preset);
			}
			Store.set(Store.STREAM_INFO_PRESETS, state.streamInfoPreset);
		},

		deleteStreamInfoPreset(state, preset:StreamInfoPreset) {
			const index = state.streamInfoPreset.findIndex(v=> v.id == preset.id);
			if(index > -1) {
				//update existing preset
				state.streamInfoPreset.splice(index, 1);
			}
			Store.set(Store.STREAM_INFO_PRESETS, state.streamInfoPreset);
		},

		startTimer(state) {
			state.timerStart = Date.now();
			const data = { startAt:state.timerStart };
			PublicAPI.instance.broadcast(TwitchatEvent.TIMER_START, data);

			const message:IRCEventDataList.TimerResult = {
				type:"timer",
				started:true,
				markedAsRead:false,
				data:{
					startAt:Date.now(),
					duration:Date.now() - state.timerStart,
				},
			};
			console.log(message);
			TriggerActionHandler.instance.onMessage(message);
		},

		stopTimer(state) {
			const data = { startAt:state.timerStart, stopAt:Date.now() };
			PublicAPI.instance.broadcast(TwitchatEvent.TIMER_STOP, data);

			const message:IRCEventDataList.TimerResult = {
				type:"timer",
				started:false,
				markedAsRead:false,
				data:{
					startAt:Date.now(),
					duration:Date.now() - state.timerStart,
				},
			};
			TriggerActionHandler.instance.onMessage(message);

			state.timerStart = -1;
		},

		startCountdown(state, payload:{timeout:number, duration:number}) {
			if(state.countdown) {
				clearTimeout(state.countdown.timeoutRef);
			}

			state.countdown = {
				timeoutRef:payload.timeout,
				startAt:Date.now(),
				duration:payload.duration,
			};

			const message:IRCEventDataList.CountdownResult = {
				type:"countdown",
				started:true,
				data:state.countdown as CountdownData,
				tags: {
					id:IRCClient.instance.getFakeGuid(),
					"tmi-sent-ts": Date.now().toString()
				},
			};
			TriggerActionHandler.instance.onMessage(message);
		},

		stopCountdown(state) {
			if(state.countdown) {
				clearTimeout(state.countdown.timeoutRef);
			}

			const message:IRCEventDataList.CountdownResult = {
				type:"countdown",
				started:false,
				data:JSON.parse(JSON.stringify(state.countdown)) as CountdownData,
				tags: {
					id:IRCClient.instance.getFakeGuid(),
					"tmi-sent-ts": Date.now().toString()
				},
			};
			TriggerActionHandler.instance.onMessage(message);
			store.dispatch("addChatMessage", message);

			const data = { startAt:state.countdown?.startAt, duration:state.countdown?.duration };
			PublicAPI.instance.broadcast(TwitchatEvent.COUNTDOWN_COMPLETE, (data as unknown) as JsonObject);

			state.countdown = null;
		},

		setTTSParams(state, params:TTSParamsData) {
			state.ttsParams = params;
			Store.set(Store.TTS_PARAMS, params);
			TTSUtils.instance.enabled = params.enabled;
		},

		setEmergencyParams(state, params:EmergencyParamsData) {
			state.emergencyParams = params;
			Store.set(Store.EMERGENCY_PARAMS, params);
		},

		setAlertParams(state, params:AlertParamsData) {
			state.chatAlertParams = params;
			Store.set(Store.ALERT_PARAMS, params);
		},
		
		setChatHighlightOverlayParams(state, params:ChatHighlightOverlayData) {
			state.chatHighlightOverlayParams = params;
			Store.set(Store.CHAT_HIGHLIGHT_PARAMS, params);
		},
		
		setSpoilerParams(state, params:SpoilerParamsData) {
			state.spoilerParams = params;
			Store.set(Store.SPOILER_PARAMS, params);
		},
		
		async highlightChatMessageOverlay(state, payload:IRCEventDataList.Message|null) {
			let data:unknown = null;
			if(payload) {
				let [user] = await TwitchUtils.loadUserInfo([payload.tags['user-id'] as string]);
				//Allow custom parsing of emotes only if it's a message of ours sent
				//from current IRC client
				const customParsing = payload.sentLocally;
				const chunks = TwitchUtils.parseEmotes(payload.message, payload.tags['emotes-raw'], false, customParsing);
				let result = "";
				for (let i = 0; i < chunks.length; i++) {
					const v = chunks[i];
					if(v.type == "text") {
						v.value = v.value.replace(/</g, "&lt;").replace(/>/g, "&gt;");//Avoid XSS attack
						result += Utils.parseURLs(v.value);
					}else if(v.type == "emote") {
					{}	let url = v.value.replace(/1.0$/gi, "3.0");//Twitch format
						url = url.replace(/1x$/gi, "3x");//BTTV format
						url = url.replace(/2x$/gi, "3x");//7TV format
						url = url.replace(/1$/gi, "4");//FFZ format
						result += "<img src='"+url+"' class='emote'>";
					}
				}
				data = {message:result, user, params:state.chatHighlightOverlayParams};
				state.isChatMessageHighlighted = true;

				const clonedData:ChatHighlightInfo = JSON.parse(JSON.stringify(data));
				clonedData.type = "chatOverlayHighlight";
				TriggerActionHandler.instance.onMessage(clonedData);
			}else{
				state.isChatMessageHighlighted = false;

				// const clonedData:ChatHighlightInfo = {type: "chatOverlayHighlight"};
				// TriggerActionHandler.instance.onMessage(clonedData);
			}
			
			PublicAPI.instance.broadcast(TwitchatEvent.SET_CHAT_HIGHLIGHT_OVERLAY_MESSAGE, data as JsonObject);
		},

		setEmergencyMode(state, enable:boolean) {
			let channel = IRCClient.instance.channel;
			state.emergencyModeEnabled = enable;
			const message:EmergencyModeInfo = {
				type: "emergencyMode",
				enabled: enable,
			}
			TriggerActionHandler.instance.onMessage(message);
			IRCClient.instance.sendNotice("emergencyMode", "Emergency mode <mark>"+(enable?'enabled':'disabled')+"</mark>");

			if(enable) {
				//ENABLE EMERGENCY MODE
				if(state.emergencyParams.slowMode) IRCClient.instance.client.slow(channel, 10);
				if(state.emergencyParams.emotesOnly) IRCClient.instance.client.emoteonly(channel);
				if(state.emergencyParams.subOnly) IRCClient.instance.client.subscribers(channel);
				if(state.emergencyParams.followOnly) IRCClient.instance.client.followersonly(channel, state.emergencyParams.followOnlyDuration);
				if(state.emergencyParams.toUsers) {
					const users = state.emergencyParams.toUsers.split(/[^a-zA-ZÀ-ÖØ-öø-ÿ0-9_]+/gi);
					for (let i = 0; i < users.length; i++) {
						const u = users[i];
						if(u.length > 2) {
							IRCClient.instance.client.timeout(channel, u, 600);
						}
					}
				}
				if(state.emergencyParams.noTriggers) TriggerActionHandler.instance.emergencyMode = true;
				if(state.emergencyParams.obsScene) OBSWebsocket.instance.setCurrentScene(state.emergencyParams.obsScene);
				if(state.emergencyParams.obsSources) {
					for (let i = 0; i < state.emergencyParams.obsSources.length; i++) {
						const s = state.emergencyParams.obsSources[i];
						OBSWebsocket.instance.setSourceState(s, false);
					}
				}
			}else{
				//DISABLE EMERGENCY MODE
				//Unset all changes
				if(state.emergencyParams.slowMode) IRCClient.instance.client.slowoff(channel);
				if(state.emergencyParams.emotesOnly) IRCClient.instance.client.emoteonlyoff(channel);
				if(state.emergencyParams.subOnly) IRCClient.instance.client.subscribersoff(channel);
				if(state.emergencyParams.followOnly) IRCClient.instance.client.followersonlyoff(channel);
				if(state.emergencyParams.toUsers) {
					const users = state.emergencyParams.toUsers.split(/[^a-zA-ZÀ-ÖØ-öø-ÿ0-9_]+/gi);
					for (let i = 0; i < users.length; i++) {
						const u = users[i];
						if(u.length > 2) {
							IRCClient.instance.client.unban(channel, u);
						}
					}
				}
				if(state.emergencyParams.obsSources) {
					for (let i = 0; i < state.emergencyParams.obsSources.length; i++) {
						const s = state.emergencyParams.obsSources[i];
						OBSWebsocket.instance.setSourceState(s, true);
					}
				}
				TriggerActionHandler.instance.emergencyMode = false;
			}

			//Broadcast to any connected peers
			PublicAPI.instance.broadcast(TwitchatEvent.EMERGENCY_MODE, {enabled:enable});
		},

		async executeChatAlert(state, message:IRCEventDataList.Message|IRCEventDataList.Whisper) {
			state.chatAlert = message;
			await Utils.promisedTimeout(50);
			state.chatAlert = null;
		},

		async addEmergencyFollower(state, payload:EmergencyFollowerData) {
			state.emergencyFollows.push(payload);
			Store.set(Store.EMERGENCY_FOLLOWERS, state.emergencyFollows);
		},

		async clearEmergencyFollows(state) {
			state.emergencyFollows.splice(0)
			Store.set(Store.EMERGENCY_FOLLOWERS, state.emergencyFollows);
		},
		
		pinMessage(state, message:IRCEventDataList.Message) { state.pinedMessages.push(message); },
		
		unpinMessage(state, message:IRCEventDataList.Message) {
			state.pinedMessages.forEach((v, index)=> {
				if(v.tags.id == message.tags.id) {
					state.pinedMessages.splice(index, 1);
				}
			})
		},
		
		setVoicemodParams(state, payload:VoicemodParamsData) {
			state.voicemodParams = payload;
			Store.set(Store.VOICEMOD_PARAMS, payload);
		},
		
		setAutomodParams(state, payload:AutomodParamsData) {
			state.automodParams = payload;
			Store.set(Store.AUTOMOD_PARAMS, payload);
		},
		
	},














	
	actions: {
		refreshAuthToken({commit}, payload:()=>boolean) { commit("authenticate", {cb:payload, forceRefresh:true}); },

		async startApp({state, commit}, payload:{authenticate:boolean, callback:()=>void}) {
			let jsonConfigs;
			try {
				const res = await fetch(Config.instance.API_PATH+"/configs");
				jsonConfigs = await res.json();
			}catch(error) {
				state.alert = "Unable to contact server :(";
				state.initComplete = true;
				return;
			}
			TwitchUtils.client_id = jsonConfigs.client_id;
			Config.instance.TWITCH_APP_SCOPES = jsonConfigs.scopes;
			Config.instance.SPOTIFY_SCOPES  = jsonConfigs.spotify_scopes;
			Config.instance.SPOTIFY_CLIENT_ID = jsonConfigs.spotify_client_id;
			Config.instance.DEEZER_SCOPES  = jsonConfigs.deezer_scopes;
			Config.instance.DEEZER_CLIENT_ID = Config.instance.IS_PROD? jsonConfigs.deezer_client_id : jsonConfigs.deezer_dev_client_id;

			PublicAPI.instance.addEventListener(TwitchatEvent.GET_CURRENT_TIMERS, ()=> {
				if(state.timerStart > 0) {
					PublicAPI.instance.broadcast(TwitchatEvent.TIMER_START, { startAt:state.timerStart });
				}
				
				if(state.countdown) {
					const data = { startAt:state.countdown?.startAt, duration:state.countdown?.duration };
					PublicAPI.instance.broadcast(TwitchatEvent.COUNTDOWN_START, data);
				}
			});

			PublicAPI.instance.addEventListener(TwitchatEvent.RAFFLE_COMPLETE, (e:TwitchatEvent)=> {
				const data = (e.data as unknown) as {winner:WheelItem};
				this.dispatch("onRaffleComplete", {publish:false, winner:data.winner});
			});

			PublicAPI.instance.addEventListener(TwitchatEvent.SHOUTOUT, (e:TwitchatEvent)=> {
				if(state.lastRaiderLogin) {
					this.dispatch("shoutout", state.lastRaiderLogin)
				}else{
					state.alert = "You have not been raided yet"
				}
			});
			
			PublicAPI.instance.addEventListener(TwitchatEvent.SET_EMERGENCY_MODE, (e:TwitchatEvent)=> {
				const enable = (e.data as unknown) as {enabled:boolean};
				let enabled = enable.enabled;
				//If no JSON is specified, just toggle the state
				if(!e.data || enabled === undefined) enabled = !state.emergencyModeEnabled;
				this.dispatch("setEmergencyMode", enabled);
			});
			
			PublicAPI.instance.addEventListener(TwitchatEvent.SET_CHAT_HIGHLIGHT_OVERLAY_MESSAGE, (e:TwitchatEvent)=> {
				state.isChatMessageHighlighted = (e.data as {message:string}).message != undefined;
			});
			
			PublicAPI.instance.addEventListener(TwitchatEvent.TEXT_UPDATE, (e:TwitchatEvent)=> {
				state.voiceText.tempText = (e.data as {text:string}).text;
				state.voiceText.finalText = "";
			});
			
			PublicAPI.instance.addEventListener(TwitchatEvent.RAW_TEXT_UPDATE, (e:TwitchatEvent)=> {
				state.voiceText.rawTempText = (e.data as {text:string}).text;
			});
			
			PublicAPI.instance.addEventListener(TwitchatEvent.SPEECH_END, (e:TwitchatEvent)=> {
				state.voiceText.finalText = (e.data as {text:string}).text;
			});
			PublicAPI.instance.initialize();

			//Overwrite store data from URL
			const queryParams = Utils.getQueryParameterByName("params");
			if(queryParams) {
				//eslint-disable-next-line
				let json:any;
				try {
					json = JSON.parse(atob(queryParams));
					for (const cat in state.params) {
						//eslint-disable-next-line
						const values = state.params[cat as ParameterCategory];
						for (const key in values) {
							const p = values[key] as ParameterData;
							if(Object.prototype.hasOwnProperty.call(json, p.id as number)) {
								p.value = json[p.id as number] as (string | number | boolean);
							}
						}
					}
					Store.set(Store.TWITCH_AUTH_TOKEN, json.access_token, false);
				}catch(error){
					//ignore
				}
			}

			IRCClient.instance.addEventListener(IRCEvent.UNFILTERED_MESSAGE, async (event:IRCEvent) => {
				const type = getTwitchatMessageType(event.data as IRCEventData);

				if(state.automodParams.enabled === true) {
					const messageData = event.data as IRCEventDataList.Message | IRCEventDataList.Highlight;
					if(type == TwitchatMessageType.MESSAGE) {
						//Make sure message passes the automod rules
						const m = (messageData as IRCEventDataList.Message);
						let rule = Utils.isAutomoded(m.message, m.tags);
						if(rule) {
							console.log(rule);
							//If rule does not requests to be applied only to first time chatters
							//or if it's a first time chatter
							if(rule.firstTimeChatters !== true ||
								(rule.firstTimeChatters === true
								&& (m.tags['first-msg'] === true || m.tags["msg-id"] == "user-intro"))
							) {
								messageData.ttAutomod = rule;
								let id = messageData.tags.id as string;
								IRCClient.instance.deleteMessage(id);
								if(rule.emergency === true && state.emergencyParams.enabled === true) {
									commit("setEmergencyMode", true);
								}
								return;
							}
						}
					}

					//Make sure user name passes the automod rules
					if(state.automodParams.banUserNames === true) {
						let username = messageData.tags.username as string;
						if(type == TwitchatMessageType.SUB || type == TwitchatMessageType.SUB_PRIME) {
							username = (messageData as IRCEventDataList.Highlight).username as string
						}
						if(username) {
							let rule = Utils.isAutomoded(username, {username});
							if(rule) {
								messageData.ttAutomod = rule;
								IRCClient.instance.sendMessage(`/ban ${username} banned by Twitchat's automod because nickname matched mod rule "${rule.label}"`);
								if(rule.emergency === true && state.emergencyParams.enabled === true) {
									commit("setEmergencyMode", true);
								}
								return;
							}
						}
					}
				}
				
				if(type == TwitchatMessageType.MESSAGE) {
					const messageData = event.data as IRCEventDataList.Message;
					const cmd = (messageData.message as string).trim().split(" ")[0].toLowerCase();

					if(messageData.sentLocally !== true) {
						SchedulerHelper.instance.incrementMessageCount();
					}
					if(/(^|\s|https?:\/\/)twitchat\.fr($|\s)/gi.test(messageData.message as string)) {
						SchedulerHelper.instance.resetAdSchedule(messageData);
					}
					
					//Is it a tracked user ?
					const trackedUser = (state.trackedUsers as TrackedUser[]).find(v => v.user['user-id'] == messageData.tags['user-id']);
					if(trackedUser) {
						if(!trackedUser.messages) trackedUser.messages = [];
						trackedUser.messages.push(messageData);
					}

					//If a raffle is in progress, check if the user can enter
					const raffle = state.raffle;
					if(raffle && raffle.mode == "chat"
					&& messageData.type == TwitchatMessageType.MESSAGE
					&& cmd == raffle.command.trim().toLowerCase()) {
						const ellapsed = new Date().getTime() - new Date(raffle.created_at).getTime();
						//Check if within time frame and max users count isn't reached and that user
						//hasn't already entered
						if(ellapsed <= raffle.duration * 60000
						&& (raffle.maxEntries <= 0 || raffle.entries.length < raffle.maxEntries)
						&& !raffle.entries.find(v=>v.id == messageData.tags['user-id'])) {
							let score = 1;
							const user = messageData.tags;
							//Apply ratios if any is defined
							if(raffle.vipRatio > 0 && user.badges?.vip) score += raffle.vipRatio;
							if(raffle.subRatio > 0 && user.badges?.subscriber)  score += raffle.subRatio;
							if(raffle.subgitRatio > 0 && user.badges?.['sub-gifter'])  score += raffle.subgitRatio;
							if(raffle.followRatio > 0) {
								//Check if user is following
								const uid = user['user-id'] as string;
								if(uid && state.followingStates[uid] == undefined) {
									const res = await TwitchUtils.getFollowState(uid, user['room-id'])
									state.followingStates[uid] = res != undefined;
									state.followingStatesByNames[(user.username ?? user['display-name'] as string)?.toLowerCase()] = res;
								}
								if(state.followingStates[uid] === true) score += raffle.followRatio;
							}
							raffle.entries.push( {
								score,
								label:user['display-name'] ?? user.username ?? "missing login",
								id:user['user-id'] as string,
							} );
							
							if(state.botMessages.raffleJoin.enabled) {
								let message = state.botMessages.raffleJoin.message;
								message = message.replace(/\{USER\}/gi, messageData.tags['display-name'] as string)
								IRCClient.instance.sendMessage(message);
							}
						}
					}
	
					//If a bingo's in progress, check if the user won it
					const bingo = state.bingo;
					if(bingo && messageData.message && bingo.winners.length == 0) {
						let win = bingo.numberValue && parseInt(messageData.message) == bingo.numberValue;
						win ||= bingo.emoteValue
						&& messageData.message.trim().toLowerCase().indexOf(bingo.emoteValue.name.toLowerCase()) === 0;
						if(win) {
							const winner = messageData.tags['display-name'] as string;
							bingo.winners = [messageData.tags];
							if(state.botMessages.bingo.enabled) {
								//TMI.js never cease to amaze me.
								//It doesn't send the message back to the sender if sending
								//it just after receiving a message.
								//If we didn't wait for a frame, the message would be sent properly
								//but wouldn't appear on this chat.
								setTimeout(()=> {
									if(state.botMessages.bingo.enabled) {
										let message = state.botMessages.bingo.message;
										message = message.replace(/\{USER\}/gi, winner)
										IRCClient.instance.sendMessage(message);
									}
								},0);
							}
	
							//Post result on chat
							const payload:IRCEventDataList.BingoResult = {
								type:"bingo",
								data:state.bingo as BingoData,
								winner,
								tags:IRCClient.instance.getFakeTags(),
							}
							this.dispatch("addChatMessage", payload);
							TriggerActionHandler.instance.onMessage(payload);
						}
					}
	
					//If there's a suggestion poll and the timer isn't over
					const suggestionPoll = state.chatPoll as ChatPollData;
					if(suggestionPoll && Date.now() - suggestionPoll.startTime < suggestionPoll.duration * 60 * 1000) {
						if(cmd == suggestionPoll.command.toLowerCase().trim()) {
							if(suggestionPoll.allowMultipleAnswers
							|| suggestionPoll.choices.findIndex(v=>v.user['user-id'] == messageData.tags['user-id'])==-1) {
								const text = messageData.message.replace(cmd, "").trim();
								if(text.length > 0) {
									suggestionPoll.choices.push({
										user: messageData.tags,
										text
									});
								}
							}
						}
					}
	
					if(messageData.type == "message" && cmd && messageData.tags.username) {
						//check if it's a command to control an OBS scene
						if(Utils.checkPermissions(state.obsCommandsPermissions, messageData.tags)) {
							for (let i = 0; i < state.obsSceneCommands.length; i++) {
								const scene = state.obsSceneCommands[i];
								if(scene.command.trim().toLowerCase() == cmd) {
									OBSWebsocket.instance.setCurrentScene(scene.scene.sceneName);
								}
							}
	
							const audioSourceName = state.obsMuteUnmuteCommands?.audioSourceName;
							if(audioSourceName) {
								//Check if it's a command to mute/unmute an audio source
								if(cmd == state.obsMuteUnmuteCommands?.muteCommand) {
									OBSWebsocket.instance.setMuteState(audioSourceName, true);
								}
								if(cmd == state.obsMuteUnmuteCommands?.unmuteCommand) {
									OBSWebsocket.instance.setMuteState(audioSourceName, false);
								}
							}
						}
						
						//check if its a command to start the emergency mode
						if(Utils.checkPermissions(state.emergencyParams.chatCmdPerms, messageData.tags)) {
							const cmd = messageData.message.trim().toLowerCase();
							if(cmd===state.emergencyParams.chatCmd.trim()) {
								commit("setEmergencyMode", true);
							}
						}
	
						//check if its a spoiler request
						if(messageData.tags["reply-parent-msg-id"] && Utils.checkPermissions(state.spoilerParams.permissions, messageData.tags)) {
							const cmd = messageData.message.replace(/@[^\s]+\s?/, "").trim().toLowerCase();
							if(cmd.indexOf("!spoiler") === 0) {
								//Search for original message the user answered to
								for (let i = 0; i < state.chatMessages.length; i++) {
									const c = state.chatMessages[i] as IRCEventDataList.Message;
									if(c.tags.id === messageData.tags["reply-parent-msg-id"]) {
										c.message = "|| "+c.message;
										break;
									}
								}
							}
						}
	
						//check if it's a chat alert command
						if(Utils.checkPermissions(state.chatAlertParams.permissions, messageData.tags)
						&& state.params.features.alertMode.value === true) {
							if(messageData.message.trim().toLowerCase().indexOf(state.chatAlertParams.chatCmd.trim().toLowerCase()) === 0) {
								let mess:IRCEventDataList.Message = JSON.parse(JSON.stringify(messageData));
								//Remove command from message to make later things easier
								commit("executeChatAlert", mess);
								let trigger:ChatAlertInfo = {
									type:"chatAlert",
									message:mess,
								}
								TriggerActionHandler.instance.onMessage(trigger);
							}
						}
						
						//Check if it's a voicemod command
						if(Utils.checkPermissions(state.voicemodParams.chatCmdPerms, messageData.tags)
						&& state.voicemodParams.commandToVoiceID[cmd]) {
							VoicemodWebSocket.instance.enableVoiceEffect(state.voicemodParams.commandToVoiceID[cmd]);
						}
					}
				}

				TriggerActionHandler.instance.onMessage(event.data as IRCEventData);
			});

			IRCClient.instance.addEventListener(IRCEvent.BADGES_LOADED, async () => {
				if(state.params.appearance.bttvEmotes.value === true) {
					BTTVUtils.instance.enable();
				}else{
					BTTVUtils.instance.disable();
				}
				if(state.params.appearance.ffzEmotes.value === true) {
					FFZUtils.instance.enable();
				}else{
					FFZUtils.instance.disable();
				}
				if(state.params.appearance.sevenTVEmotes.value === true) {
					SevenTVUtils.instance.enable();
				}else{
					SevenTVUtils.instance.disable();
				}
				const followings = await TwitchUtils.getFollowings(UserSession.instance.user?.id);
				let hashmap:{[key:string]:boolean} = {};
				followings.forEach(v => {
					hashmap[v.to_id] = true;
				});
				state.myFollowings = hashmap;
			});

			IRCClient.instance.addEventListener(IRCEvent.JOIN, async (event:IRCEvent) => {
				const data = event.data as IRCEventDataList.JoinLeaveList;
				const users = data.users;

				if(state.params.features.notifyJoinLeave.value === true) {
					const usersClone = users.concat();
					const join = usersClone.splice(0, 30);
					let message = "<mark>"+join.join("</mark>, <mark>")+"</mark>";
					if(usersClone.length > 0) {
						message += " and <mark>"+usersClone.length+"</mark> more";
					}else{
						message = message.replace(/,([^,]*)$/, " and$1");
					}
					message += " joined the chat room";
					IRCClient.instance.sendNotice("online", message, data.channel);
				}

				if(state.automodParams.enabled === true
				&& state.automodParams.banUserNames === true) {
					for (let i = 0; i < users.length; i++) {
						const username = users[i];
						const rule = Utils.isAutomoded(username, {username});
						if(rule != null) {
							IRCClient.instance.sendMessage(`/ban ${username} banned by Twitchat's automod because nickname matched mod rule "${rule!.label}"`);
							IRCClient.instance.sendHighlight({
								channel: UserSession.instance.authToken.login,
								type:"highlight",
								username,
								ttAutomod:rule as AutomodParamsKeywordFilterData,
								tags:{
									"tmi-sent-ts":Date.now().toString(),
									"msg-id": "autoban_join",
								},
							});
						}
					}
				}

				//If non followers highlight option is enabled, get follow state of
				//all the users that joined
				if(state.params.appearance.highlightNonFollowers.value === true) {
					const channelInfos = await TwitchUtils.loadUserInfo(undefined, [data.channel.replace("#", "")]);
					const usersFull = await TwitchUtils.loadUserInfo(undefined, users);
					for (let i = 0; i < usersFull.length; i++) {
						const uid = usersFull[i].id;
						if(uid && state.followingStates[uid] == undefined) {
							try {
								const follows:boolean = await TwitchUtils.getFollowState(uid, channelInfos[0].id);
								state.followingStates[uid] = follows;
								state.followingStatesByNames[usersFull[i].login.toLowerCase()] = follows;
							}catch(error) {
								/*ignore*/
								console.log("error checking follow state", error)
							}
						}
					}
				}
			});

			IRCClient.instance.addEventListener(IRCEvent.LEAVE, async (event:IRCEvent) => {
				if(state.params.features.notifyJoinLeave.value === true) {
					const data = event.data as IRCEventDataList.JoinLeaveList;
					const users = data.users;
					const leave = users.splice(0, 30);
					let message = "<mark>"+leave.join("</mark>, <mark>")+"</mark>";
					if(users.length > 0) {
						message += " and <mark>"+users.length+"</mark> more";
					}else{
						message = message.replace(/,([^,]*)$/, " and$1");
					}
					message += " left the chat room";
					IRCClient.instance.sendNotice("offline", message, data.channel);
				}
			});

			IRCClient.instance.addEventListener(IRCEvent.MESSAGE, (event:IRCEvent) => {
				this.dispatch("addChatMessage", event.data);
			});

			IRCClient.instance.addEventListener(IRCEvent.NOTICE, (event:IRCEvent) => {
				this.dispatch("addChatMessage", event.data);
			});

			IRCClient.instance.addEventListener(IRCEvent.HIGHLIGHT, (event:IRCEvent) => {
				this.dispatch("addChatMessage", event.data);
			});

			IRCClient.instance.addEventListener(IRCEvent.BAN, (event:IRCEvent) => {
				const data = (event.data as IRCEventDataList.Ban);
				this.dispatch("delUserMessages", data.username);
			});

			IRCClient.instance.addEventListener(IRCEvent.TIMEOUT, (event:IRCEvent) => {
				const data = (event.data as IRCEventDataList.Timeout);
				this.dispatch("delUserMessages", data.username);
			});

			IRCClient.instance.addEventListener(IRCEvent.CLEARCHAT, () => {
				state.chatMessages = [];
			});

			IRCClient.instance.addEventListener(IRCEvent.WHISPER, (event:IRCEvent) => {
				if(state.params.features.receiveWhispers.value === true) {
					const data = event.data as IRCEventDataList.Whisper;
					const uid = data.tags['user-id'] as string;
					const whispers = state.whispers as {[key:string]:IRCEventDataList.Whisper[]};
					if(!whispers[uid]) whispers[uid] = [];
					data.timestamp = Date.now();
					whispers[uid].push(data);
					state.whispers = whispers;
					state.whispersUnreadCount ++;

					if(state.params.features.showWhispersOnChat.value === true){
					// && data.raw != "") {//Don't show whispers we sent to someone, on the chat
						data.type = "whisper";
						data.channel = IRCClient.instance.channel;
						data.tags['tmi-sent-ts'] = Date.now().toString();
						this.dispatch("addChatMessage", data);
					}

					//Broadcast to OBS-ws
					const wsUser = {
						id: data.tags['user-id'],
						login: data.tags.username,
						color: data.tags.color,
						badges: data.tags.badges as {[key:string]:JsonObject | JsonArray | JsonValue},
						'display-name': data.tags['display-name'],
						'message-id': data.tags['message-id'],
					}
					PublicAPI.instance.broadcast(TwitchatEvent.MESSAGE_WHISPER, {unreadCount:state.whispersUnreadCount, user:wsUser, message:"<not set for privacy reasons>"});
				}
			});

			IRCClient.instance.addEventListener(IRCEvent.ROOMSTATE, (event:IRCEvent) => {
				const data = event.data as IRCEventDataList.RoomState
				if(data.tags['emote-only'] != undefined) state.roomStatusParams.emotesOnly.value = data.tags['emote-only'] != false;
				if(data.tags['subs-only'] != undefined) state.roomStatusParams.subsOnly.value = data.tags['subs-only'] != false;
				if(data.tags['followers-only'] != undefined) state.roomStatusParams.followersOnly.value = parseInt(data.tags['followers-only']) > -1;
				if(data.tags.slow != undefined) state.roomStatusParams.slowMode.value = data.tags.slow != false;
			});

			IRCClient.instance.addEventListener(IRCEvent.REFRESH_TOKEN, (event:IRCEvent) => {
				commit("authenticate", {});
			});

			//Makes sure all parameters have a unique ID !
			let uniqueIdsCheck:{[key:number]:boolean} = {};
			for (const cat in state.params) {
				const values = state.params[cat as ParameterCategory];
				for (const key in values) {
					const p = values[key] as ParameterData;
					if(uniqueIdsCheck[p.id as number] === true) {
						state.alert = "Duplicate parameter id (" + p.id + ") found for parameter \"" + key + "\"";
						break;
					}
					uniqueIdsCheck[p.id as number] = true;
				}
			}
			
			//Make sure all triggers have a unique ID !
			uniqueIdsCheck = {};
			for (const key in TriggerTypes) {
				//@ts-ignore
				const v = TriggerTypes[key];
				if(uniqueIdsCheck[v] === true) {
					state.alert = "Duplicate trigger type id (" + v + ") found for trigger \"" + key + "\"";
					break;
				}
				uniqueIdsCheck[v] = true;
			}

			//Authenticate user
			const token = Store.get(Store.TWITCH_AUTH_TOKEN);
			let authenticated = false;
			if(token && payload.authenticate) {
				const cypherKey = Store.get(Store.CYPHER_KEY)
				TwitchCypherPlugin.instance.initialize(cypherKey);
				SpotifyHelper.instance.addEventListener(SpotifyHelperEvent.CONNECTED, (e:SpotifyHelperEvent)=>{
					this.dispatch("setSpotifyToken", e.token);
				});
				SpotifyHelper.instance.addEventListener(SpotifyHelperEvent.ERROR, (e:SpotifyHelperEvent)=>{
					state.alert = e.error as string;
				});
				DeezerHelper.instance.addEventListener(DeezerHelperEvent.CONNECTED, ()=>{
					this.dispatch("setDeezerConnected", true);
				});
				DeezerHelper.instance.addEventListener(DeezerHelperEvent.CONNECT_ERROR, ()=>{
					this.dispatch("setDeezerConnected", false);
					state.alert = "Deezer authentication failed";
				});
				VoicemodWebSocket.instance.addEventListener(VoicemodEvent.VOICE_CHANGE, async (e:VoicemodEvent)=> {
					TriggerActionHandler.instance.onMessage({ type:"voicemod", voiceID: e.voiceID });
					for (let i = 0; i < VoicemodWebSocket.instance.voices.length; i++) {
						const v = VoicemodWebSocket.instance.voices[i];
						if(v.voiceID == e.voiceID) {
							const img = await VoicemodWebSocket.instance.getBitmapForVoice(v.voiceID);
							v.image = img;
							state.voicemodCurrentVoice = v;
						}
					}
				})

				try {
					await new Promise((resolve,reject)=> {
						commit("authenticate", {cb:(success:boolean)=>{
							if(success) {
								resolve(null);
							}else{
								reject();
							}
						}});
					});

					//Use an anonymous method to avoid blocking loading while
					//all twitch tags are loading
					(async () => {
						try {
							TwitchUtils.searchTag("");//Preload tags to build local cache
							if(store.state.hasChannelPoints) {
								await TwitchUtils.getPolls();
								await TwitchUtils.getPredictions();
							}
						}catch(e) {
							//User is probably not an affiliate
						}
					})();
				}catch(error) {
					console.log(error);
					state.authenticated = false;
					Store.remove("oAuthToken");
					state.initComplete = true;
					payload.callback();
					return;
				}

				if(Store.syncToServer === true && state.authenticated) {
					if(!await Store.loadRemoteData()) {
						//Force data sync popup to show up if remote
						//data have been deleted
						Store.remove(Store.SYNC_DATA_TO_SERVER);
					}
				}
	
				const devmode = Store.get(Store.DEVMODE) === "true";
				this.dispatch("toggleDevMode", devmode);
				this.dispatch("sendTwitchatAd");
				
				if(!Store.get(Store.TWITCHAT_AD_WARNED) && !UserSession.instance.isDonor) {
					setTimeout(()=>{
						this.dispatch("sendTwitchatAd", TwitchatAdTypes.TWITCHAT_AD_WARNING);
					}, 5000)
				}else
				if(!Store.get(Store.TWITCHAT_SPONSOR_PUBLIC_PROMPT) && UserSession.instance.isDonor) {
					setTimeout(()=>{
						this.dispatch("sendTwitchatAd", TwitchatAdTypes.TWITCHAT_SPONSOR_PUBLIC_PROMPT);
					}, 5000)
				}

				authenticated = true;
			}
	
			this.dispatch("loadDataFromStorage", authenticated);
			
			state.initComplete = true;
			
			payload.callback();
		},
		
		loadDataFromStorage({state}, authenticated) {
			//Loading parameters from local storage and pushing them to current store
			const props = Store.getAll();
			for (const cat in state.params) {
				const c = cat as ParameterCategory;
				for (const key in props) {
					const k = key.replace(/^p:/gi, "");
					if(props[key] == null) continue;
					if(/^p:/gi.test(key) && k in state.params[c]) {
						const v:string = props[key] as string;
						/* eslint-disable-next-line */
						const pointer = state.params[c][k as ParameterCategory];
						if(typeof pointer.value === 'boolean') {
							pointer.value = (v == "true");
						}
						if(typeof pointer.value === 'string') {
							pointer.value = v;
						}
						if(typeof pointer.value === 'number') {
							pointer.value = parseFloat(v);
						}
					}
				}
			}

			if(authenticated) {
				//Init OBS scenes params
				const obsSceneCommands = Store.get(Store.OBS_CONF_SCENES);
				if(obsSceneCommands) {
					state.obsSceneCommands = JSON.parse(obsSceneCommands);
				}
				
				//Init OBS command params
				const obsMuteUnmuteCommands = Store.get(Store.OBS_CONF_MUTE_UNMUTE);
				if(obsMuteUnmuteCommands) {
					Utils.mergeRemoteObject(JSON.parse(obsMuteUnmuteCommands), (state.obsMuteUnmuteCommands as unknown) as JsonObject);
				}
				
				//Init OBS permissions
				const obsCommandsPermissions = Store.get(Store.OBS_CONF_PERMISSIONS);
				if(obsCommandsPermissions) {
					Utils.mergeRemoteObject(JSON.parse(obsCommandsPermissions), (state.obsCommandsPermissions as unknown) as JsonObject);
				}

				//Init TTS actions
				const tts = Store.get(Store.TTS_PARAMS);
				if (tts) {
					Utils.mergeRemoteObject(JSON.parse(tts), (state.ttsParams as unknown) as JsonObject);
					TTSUtils.instance.enabled = state.ttsParams.enabled;
				}
				
				//Init emergency actions
				const emergency = Store.get(Store.EMERGENCY_PARAMS);
				if(emergency) {
					Utils.mergeRemoteObject(JSON.parse(emergency), (state.emergencyParams as unknown) as JsonObject);
				}
				
				//Init alert actions
				const alert = Store.get(Store.ALERT_PARAMS);
				if(alert) {
					Utils.mergeRemoteObject(JSON.parse(alert), (state.chatAlertParams as unknown) as JsonObject);
				}
				
				//Init spoiler param
				const spoiler = Store.get(Store.SPOILER_PARAMS);
				if(spoiler) {
					Utils.mergeRemoteObject(JSON.parse(spoiler), (state.spoilerParams as unknown) as JsonObject);
				}
				
				//Init chat highlight params
				const chatHighlight = Store.get(Store.CHAT_HIGHLIGHT_PARAMS);
				if(chatHighlight) {
					Utils.mergeRemoteObject(JSON.parse(chatHighlight), (state.chatHighlightOverlayParams as unknown) as JsonObject);
				}
				
				//Init triggers
				const triggers = Store.get(Store.TRIGGERS);
				if(triggers) {
					Utils.mergeRemoteObject(JSON.parse(triggers), (state.triggers as unknown) as JsonObject);
					TriggerActionHandler.instance.triggers = state.triggers;
				}
					
				//Init stream info presets
				const presets = Store.get(Store.STREAM_INFO_PRESETS);
				if(presets) {
					state.streamInfoPreset = JSON.parse(presets);
				}

				//Init emergency followers
				const emergencyFollows = Store.get(Store.EMERGENCY_FOLLOWERS);
				if(emergencyFollows) {
					state.emergencyFollows = JSON.parse(emergencyFollows);
				}

				//Init music player params
				const musicPlayerParams = Store.get(Store.MUSIC_PLAYER_PARAMS);
				if(musicPlayerParams) {
					Utils.mergeRemoteObject(JSON.parse(musicPlayerParams), (state.musicPlayerParams as unknown) as JsonObject);
				}
				
				//Init Voice control actions
				const voiceActions = Store.get("voiceActions");
				if(voiceActions) {
					state.voiceActions = JSON.parse(voiceActions);
				}
				
				//Init Voice control language
				const voiceLang = Store.get("voiceLang");
				if(voiceLang) {
					state.voiceLang = voiceLang;
					VoiceController.instance.lang = voiceLang;
				}
				
				//Init bot messages
				const botMessages = Store.get(Store.BOT_MESSAGES);
				if(botMessages) {
					//Merge remote and local to avoid losing potential new
					//default values on local data
					Utils.mergeRemoteObject(JSON.parse(botMessages), (state.botMessages as unknown) as JsonObject, true);
				}

				//Init spotify connection
				const spotifyAuthToken = Store.get(Store.SPOTIFY_AUTH_TOKEN);
				if(spotifyAuthToken && Config.instance.SPOTIFY_CLIENT_ID != "") {
					this.dispatch("setSpotifyToken", JSON.parse(spotifyAuthToken));
				}

				//Init spotify credentials
				const spotifyAppParams = Store.get(Store.SPOTIFY_APP_PARAMS);
				if(spotifyAuthToken && spotifyAppParams) {
					this.dispatch("setSpotifyCredentials", JSON.parse(spotifyAppParams));
				}

				//Init voicemod
				const voicemodParams = Store.get(Store.VOICEMOD_PARAMS);
				if(voicemodParams) {
					this.dispatch("setVoicemodParams", JSON.parse(voicemodParams));
					if(state.voicemodParams.enabled) {
						VoicemodWebSocket.instance.connect();
					}
				}

				//Init automod
				const automodParams = Store.get(Store.AUTOMOD_PARAMS);
				if(automodParams) {
					Utils.mergeRemoteObject(JSON.parse(automodParams), (state.automodParams as unknown) as JsonObject);
					this.dispatch("setAutomodParams", state.automodParams);
				}

				SchedulerHelper.instance.start();
			}
			
			//Initialise new toggle param for OBS connection.
			//If any OBS param exists, set it to true because the
			//user probably configured it. Otherwise set it to false
			if(Store.get(Store.OBS_CONNECTION_ENABLED) === null) {
				if(Store.get(Store.OBS_PASS) || Store.get(Store.OBS_PORT) || state.obsMuteUnmuteCommands || state.obsSceneCommands.length > 0) {
					state.obsConnectionEnabled = true;
				}else{
					state.obsConnectionEnabled = false;
				}
				Store.set(Store.OBS_CONNECTION_ENABLED, state.obsConnectionEnabled);
			}else{
				state.obsConnectionEnabled = Store.get(Store.OBS_CONNECTION_ENABLED) === "true";
			}
			
			//Init OBS connection
			//If params are specified on URL, use them (used by overlays)
			let port = Utils.getQueryParameterByName("obs_port");
			let pass = Utils.getQueryParameterByName("obs_pass");
			let ip = Utils.getQueryParameterByName("obs_ip");
			const urlForced = port || pass || ip;
			if(!port) port = Store.get(Store.OBS_PORT);
			if(!pass) pass = Store.get(Store.OBS_PASS);
			if(!ip) ip = Store.get(Store.OBS_IP);
			//If OBS params are on URL or if connection is enabled, connect
			if((state.obsConnectionEnabled || urlForced)
			&& (port != undefined || pass != undefined || ip != undefined)) {
				state.obsConnectionEnabled = true;
				OBSWebsocket.instance.connect(port, pass, true, ip);
			}
		},
		
		confirm({commit}, payload) { commit("confirm", payload); },
		
		sendTwitchatAd({commit}, contentID?:number) { commit("sendTwitchatAd", contentID); },

		authenticate({ commit }, payload) { commit("authenticate", payload); },

		logout({ commit }) { commit("logout"); },

		openTooltip({commit}, payload) { commit("openTooltip", payload); },
		
		closeTooltip({commit}) { commit("closeTooltip", null); },
		
		showParams({commit}, payload) { commit("showParams", payload); },
		
		openUserCard({commit}, payload) { commit("openUserCard", payload); },
		
		addChatMessage({commit}, payload) { commit("addChatMessage", payload); },
		
		delChatMessage({commit}, data) { commit("delChatMessage", data); },

		delUserMessages({commit}, payload) { commit("delUserMessages", payload); },

		updateParams({commit}) { commit("updateParams"); },
		
		setCypherKey({commit}, payload:string) { commit("setCypherKey", payload); },

		setPolls({state}, payload:{data:TwitchDataTypes.Poll[], postOnChat?:boolean}) {
			const list = state.activityFeed as ActivityFeedData[];
			if(payload.postOnChat === true) {
				const poll = payload.data[0];
				if(poll.status == "COMPLETED" || poll.status == "TERMINATED") {
					if(list.findIndex(v=>v.type == "poll" && v.data.id == poll.id) == -1) {
						const m:IRCEventDataList.PollResult = {
							tags:{
								id:IRCClient.instance.getFakeGuid(),
								"tmi-sent-ts": Date.now().toString()},
							type:"poll",
							markedAsRead:false,
							data:poll
						};
						this.dispatch("addChatMessage", m);
						TriggerActionHandler.instance.onMessage(m);
					}
				}
			}
			
			state.currentPoll = payload.data.find(v => {
				return (v.status == "ACTIVE" || v.status == "COMPLETED" || v.status == "TERMINATED");
			}) as  TwitchDataTypes.Poll;
		},

		setPredictions({state}, payload:TwitchDataTypes.Prediction[]) {
			const list = state.activityFeed as ActivityFeedData[];
			if(payload[0].status == "RESOLVED" && new Date(payload[0].ended_at as string).getTime() > Date.now() - 5 * 60 * 1000) {
				if(list.findIndex(v=>v.type == "prediction" && v.data.id == payload[0].id) == -1) {
					const m:IRCEventDataList.PredictionResult = {
						tags:{
							id:IRCClient.instance.getFakeGuid(),
							"tmi-sent-ts": Date.now().toString()},
						type:"prediction",
						markedAsRead:false,
						data:payload[0]
					};
					this.dispatch("addChatMessage", m);
					TriggerActionHandler.instance.onMessage(m);
				}
			}
			state.currentPrediction = payload.find(v => {
				return (v.status == "ACTIVE" || v.status == "LOCKED");
			}) as  TwitchDataTypes.Prediction;
		},

		setCypherEnabled({commit}, payload:boolean) { commit("setCypherEnabled", payload); },

		setUserState({commit}, payload:UserNoticeState) { commit("setUserState", payload); },

		setEmotes({commit}, payload:TwitchDataTypes.Emote[]) { commit("setEmotes", payload); },

		setEmoteSelectorCache({commit}, payload:{user:TwitchDataTypes.UserInfo, emotes:TwitchDataTypes.Emote[]}[]) { commit("setEmoteSelectorCache", payload); },

		trackUser({commit}, payload:IRCEventDataList.Message) { commit("trackUser", payload); },

		untrackUser({commit}, payload:ChatUserstate) { commit("untrackUser", payload); },

		ttsReadMessage({commit}, payload:IRCEventDataList.Message) { commit("ttsReadMessage", payload); },
		
		ttsReadUser({commit}, payload:{username:string, read:boolean}) { commit("ttsReadUser", payload); },
		
		setChatPoll({commit}, payload:ChatPollData) { commit("setChatPoll", payload); },

		startRaffle({commit}, payload:RaffleData) { commit("startRaffle", payload); },

		stopRaffle({commit}) { commit("stopRaffle"); },

		onRaffleComplete({commit}, payload:{publish:boolean, winner:WheelItem}) { commit("onRaffleComplete", payload); },

		startBingo({commit}, payload:BingoConfig) { commit("startBingo", payload); },

		stopBingo({commit}) { commit("stopBingo"); },

		closeWhispers({commit}, userID:string) { commit("closeWhispers", userID); },

		setRaiding({commit}, infos:PubSubDataTypes.RaidInfos) { commit("setRaiding", infos); },

		setViewersList({commit}, users:string[]) { commit("setViewersList", users); },
		
		toggleDevMode({commit}, forcedState?:boolean) { commit("toggleDevMode", forcedState); },

		setHypeTrain({commit}, data:HypeTrainStateData) { commit("setHypeTrain", data); },

		flagLowTrustMessage({commit}, data:PubSubDataTypes.LowTrustMessage) { commit("flagLowTrustMessage", {data:data}); },

		canSplitView({commit}, value:boolean) { commit("canSplitView", value); },

		searchMessages({commit}, value:string) { commit("searchMessages", value); },

		setPlaybackState({commit}, value:PubSubDataTypes.PlaybackInfo) { commit("setPlaybackState", value); },

		setCommunityBoost({commit}, value:PubSubDataTypes.CommunityBoost) { commit("setCommunityBoost", value); },

		setOBSSceneCommands({commit}, value:OBSSceneCommand[]) { commit("setOBSSceneCommands", value); },

		setOBSMuteUnmuteCommands({commit}, value:OBSMuteUnmuteCommands[]) { commit("setOBSMuteUnmuteCommands", value); },

		setObsCommandsPermissions({commit}, value:PermissionsData) { commit("setObsCommandsPermissions", value); },

		setTrigger({commit}, value:{key:string, data:TriggerActionObsData[]|TriggerData}) { commit("setTrigger", value); },

		deleteTrigger({commit}, value:string) { commit("deleteTrigger", value); },

		updateBotMessage({commit}, value:{key:string, enabled:boolean, message:string}) { commit("updateBotMessage", value); },

		setVoiceLang({commit}, value:string) { commit("setVoiceLang", value); },

		setVoiceActions({commit}, value:VoiceAction[]) { commit("setVoiceActions", value); },

		ahsInstaller({commit}, value:InstallHandler) { commit("ahsInstaller", value); },

		setSpotifyCredentials({commit}, value:{client:string, secret:string}) { commit("setSpotifyCredentials", value); },

		setSpotifyAuthResult({commit}, value:SpotifyAuthResult) { commit("setSpotifyAuthResult", value); },

		setSpotifyToken({commit}, value:SpotifyAuthToken) { commit("setSpotifyToken", value); },
		

		setDeezerConnected({commit}, value:boolean) { commit("setDeezerConnected", value); },

		setCommercialEnd({commit}, date:number) {
			commit("setCommercialEnd", date);
			if(date === 0) {
				IRCClient.instance.sendNotice("commercial", "Commercial break complete");
			}else{
				const duration = Math.round((date - Date.now())/1000)
				IRCClient.instance.sendNotice("commercial", "A commercial just started for "+duration+" seconds");
			}
		},
		

		shoutout({commit}, username:string) { commit("shoutout", username); },

		saveStreamInfoPreset({commit}, preset:StreamInfoPreset) { commit("saveStreamInfoPreset", preset); },
		
		deleteStreamInfoPreset({commit}, preset:StreamInfoPreset) { commit("deleteStreamInfoPreset", preset); },
		
		startTimer({commit}) { commit("startTimer"); },
		
		stopTimer({commit}) { commit("stopTimer"); },
		
		startCountdown({commit, state}, duration:number) {
			let timeout = setTimeout(()=> {
				commit("stopCountdown");
			}, Math.max(duration, 1000));

			commit("startCountdown", {duration, timeout});
			
			const data = { startAt:state.countdown?.startAt, duration:state.countdown?.duration };
			PublicAPI.instance.broadcast(TwitchatEvent.COUNTDOWN_START, data);
		},
		
		stopCountdown({commit}) { commit("stopCountdown"); },

		setTTSParams({commit}, params:TTSParamsData) { commit("setTTSParams", params); },
		
		setEmergencyParams({commit}, params:EmergencyParamsData) { commit("setEmergencyParams", params); },
		
		setAlertParams({commit}, params:AlertParamsData) { commit("setAlertParams", params); },
		
		setChatHighlightOverlayParams({commit}, params:ChatHighlightOverlayData) { commit("setChatHighlightOverlayParams", params); },
		
		highlightChatMessageOverlay({commit}, payload:IRCEventDataList.Message|null) { commit("highlightChatMessageOverlay", payload); },
		
		setSpoilerParams({commit}, params:SpoilerParamsData) { commit("setSpoilerParams", params); },
		
		setEmergencyMode({commit}, enable:boolean) { commit("setEmergencyMode", enable); },

		executeChatAlert({commit}, message:IRCEventDataList.Message|IRCEventDataList.Whisper) { commit("executeChatAlert", message); },

		addEmergencyFollower({commit}, payload:EmergencyFollowerData) { commit("addEmergencyFollower", payload); },
		
		clearEmergencyFollows({commit}) { commit("clearEmergencyFollows"); },
		
		pinMessage({commit}, message:IRCEventDataList.Message) { commit("pinMessage", message); },
		
		unpinMessage({commit}, message:IRCEventDataList.Message) { commit("unpinMessage", message); },
		
		setVoicemodParams({commit}, payload:VoicemodParamsData) { commit("setVoicemodParams", payload); },
		
		setAutomodParams({commit}, payload:AutomodParamsData) { commit("setAutomodParams", payload); },
	},
	modules: {
	}
})

export default store;