import { DataStore } from "@/internals";
import type { TwitchatDataTypes } from '@/internals'
import BTTVUtils from '@/utils/BTTVUtils';
import FFZUtils from '@/utils/FFZUtils';
import SevenTVUtils from '@/utils/SevenTVUtils';
import { defineStore } from 'pinia'

export const storeParams = defineStore('params', {
	state: () => ({
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
		} as {[key:string]:TwitchatDataTypes.ParameterData},
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
		} as {[key:string]:TwitchatDataTypes.ParameterData},
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
		} as {[key:string]:TwitchatDataTypes.ParameterData},
	} as TwitchatDataTypes.IParameterCategory),



	getters: {
	},



	actions: {

		updateParams() {
			const sParams = storeParams();
			for (const cat in sParams.$state) {
				const c = cat as TwitchatDataTypes.ParameterCategory;
				for (const key in sParams[c]) {
					/* eslint-disable-next-line */
					const v = sParams[c][key as TwitchatDataTypes.ParameterCategory].value;
					DataStore.set("p:"+key, v);
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
	},
})