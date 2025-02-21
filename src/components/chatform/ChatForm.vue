<template>
	<div :class="classes">
		<div class="holder">
			<div class="leftForm">
				<Button aria-label="Open parameters" :icon="$image('icons/params.svg')" bounce @click="toggleParams()" />
				<Button aria-label="Open chat commands" :icon="$image('icons/commands.svg')" bounce @click="$emit('update:showCommands', true)" />
				<Button aria-label="Open users list" :icon="$image('icons/user.svg')" bounce @click="$emit('update:showChatUsers', true)" :data-tooltip="onlineUsersTooltip" />
				<Button aria-label="Open activity feed" :icon="$image('icons/notification.svg')" bounce @click="$emit('update:showFeed', true)" v-if="showFeedBt" />
				<!-- <Button :icon="$image('icons/channelPoints.svg')" bounce @click="$emit('update:showRewards', true)" /> -->
			</div>

			<form @submit.prevent="" class="inputForm">
				<img src="@/assets/loader/loader_white.svg" alt="loader" class="loader" v-if="loading">

				<input type="text"
					class="dark"
					v-model="message"
					v-if="!error"
					ref="input"
					placeholder="message..."
					:maxlength="maxLength"
					@keyup.capture.tab="(e)=>onTab(e)"
					@keydown.enter="(e:Event)=>sendMessage(e)"
					@keydown="onKeyDown">
				
				<span @click="error=false" v-if="error" class="error">Woops... something went wrong when sending the message :(</span>
				
				<Button aria-label="Open emotes list"
					:icon="$image('icons/emote.svg')"
					bounce 
					@click="$emit('update:showEmotes',true);" />

				<transition name="blink">
				<Button aria-label="Open current poll"
					:icon="$image('icons/poll.svg')"
					bounce
					@click="$emit('setCurrentNotification', 'poll')"
					v-if="$store.state.currentPoll?.id" />
				</transition>

				<transition name="blink">
				<Button aria-label="Open current chat poll"
					:icon="$image('icons/chatPoll.svg')"
					bounce
					@click="$emit('setCurrentNotification', 'chatpoll')"
					v-if="$store.state.chatPoll != null" />
				</transition>

				<transition name="blink">
				<Button aria-label="Open current prediction"
					:icon="$image('icons/prediction.svg')"
					bounce
					@click="$emit('setCurrentNotification', 'prediction')"
					v-if="$store.state.currentPrediction?.id" />
				</transition>

				<transition name="blink">
				<Button aria-label="Open tracked users"
					:icon="$image('icons/magnet.svg')"
					bounce
					v-if="$store.state.trackedUsers.length > 0"
					data-tooltip="View tracked users"
					@click="$emit('setCurrentNotification', 'trackedUsers')" />
				</transition>

				<transition name="blink">
				<div class="whispers" v-if="$store.state.raffle && $store.state.raffle.mode == 'chat'">
					<Button aria-label="Open current raffle"
						:icon="$image('icons/ticket.svg')"
						bounce
						data-tooltip="Raffle"
						@click="$emit('setCurrentNotification', 'raffle')" />
					<div class="count" v-if="$store.state.raffle.entries.length > 0">{{$store.state.raffle.entries.length}}</div>
				</div>
				</transition>

				<transition name="blink">
				<Button aria-label="Open current bingo"
					:icon="$image('icons/bingo.svg')"
					bounce
					v-if="$store.state.bingo"
					data-tooltip="Bingo"
					@click="$emit('setCurrentNotification', 'bingo')" />
				</transition>

				<transition name="blink">
				<div class="whispers" v-if="whispersAvailable">
					<Button aria-label="Open whispers"
						:icon="$image('icons/whispers.svg')"
						bounce
						small
						data-tooltip="Whispers"
						@click="$emit('setCurrentNotification', 'whispers')" />
					<div class="count" v-if="$store.state.whispersUnreadCount > 0">{{$store.state.whispersUnreadCount}}</div>
				</div>
				</transition>

				<transition name="blink">
				<div class="pins" v-if="$store.state.pinedMessages.length > 0">
					<Button aria-label="Open pined messages"
						:icon="$image('icons/pin.svg')"
						bounce
						small
						data-tooltip="Pined messages"
						@click="$emit('pins')" />
					<div class="count">{{$store.state.pinedMessages.length}}</div>
				</div>
				</transition>

				<transition name="blink">
				<Button aria-label="Toggle messages encryption"
					:icon="$image('icons/'+($store.state.cypherEnabled? 'lock.svg' : 'unlock.svg'))"
					@click="toggleCypher()"
					v-if="cypherConfigured"
					bounce
					data-tooltip="Send encrypted<br>messages" />
				</transition>

				<transition name="blink">
				<Button aria-label="Open deezer player"
					:icon="$image('icons/deezer.svg')"
					bounce
					v-if="$store.state.deezerConnected"
					data-tooltip="Deezer"
					@click="$emit('setCurrentNotification', 'deezer')" />
				</transition>

				<transition name="blink">
				<Button small highlight class="chatHighlight" aria-label="chatHighlight button"
					:icon="$image('icons/highlight_del.svg')"
					bounce
					v-if="chatHighlightEnabled"
					data-tooltip="Remove currently<br>highlighted message"
					@click="removeChatHighlight()" />
				</transition>

				<CommunityBoostInfo v-if="$store.state.communityBoostState" />

				<TimerCountDownInfo v-if="$store.state.countdown || $store.state.timerStart > 0" />

				<CommercialTimer v-if="isCommercial" />

				<div v-if="$store.state.params.appearance.showViewersCount.value === true
					&& $store.state.playbackState && $store.state.playbackState.viewers > 0"
					data-tooltip="Viewer count"
					class="viewCount"
					@click="censoredViewCount = !censoredViewCount"
				>
					<p v-if="censoredViewCount">x</p>
					<p v-if="!censoredViewCount">{{$store.state.playbackState.viewers}}</p>
					<img src="@/assets/icons/user.svg" alt="viewers">
				</div>

				<transition name="blink">
				<Button small highlight class="voice" aria-label="start voice bot"
					:icon="$image('icons/microphone'+(voiceBotStarted? '_recording' : '')+'.svg')"
					bounce
					v-if="voiceBotConfigured"
					:data-tooltip="voiceBotStarted? 'Stop voice bot' : 'Start voice bot'"
					@click="toggleVoiceBot()" />
				</transition>

				<transition name="blink">
				<Button aria-label="Open dev mode options"
					:icon="$image('icons/debug.svg')"
					bounce
					@click="$emit('update:showDevMenu',true);"
					v-if="$store.state.devmode" />
				</transition>

				<transition name="blink">
				<Button small highlight class="emergency" aria-label="emergency button"
					v-if="emergencyButtonEnabled"
					:icon="$image('icons/emergency.svg')"
					bounce
					:data-tooltip="$store.state.emergencyModeEnabled? 'Stop emergency mode' : 'Start emergency'"
					@click="toggleEmergencyMode()" />
				</transition>

			</form>

			<div class="floatingButtons">
				<transition name="slide">
					<Button small class="muteBt" aria-label="mute text to speech"
						:icon="$image('icons/mute.svg')"
						v-if="$store.state.ttsSpeaking"
						data-tooltip="Stop speaking"
						@click="stopTTS()" />
				</transition>

				<transition name="slide">
					<Button small class="voicemodBt" aria-label="Reset voice effect"
						v-if="$store.state.voicemodParams.voiceIndicator && $store.state.voicemodCurrentVoice.voiceID != 'nofx'"
						:icon="'data:image/png;base64,' + $store.state.voicemodCurrentVoice.image"
						data-tooltip="Reset voice effect"
						@click="resetVoiceEffect()" />
				</transition>
			</div>

			<AutocompleteChatForm class="contentWindows emotesLive"
				v-if="openAutoComplete"
				:search="autoCompleteSearch"
				:emotes="autoCompleteEmotes"
				:users="autoCompleteUsers"
				:commands="autoCompleteCommands"
				@close="autoCompleteSearch = ''"
				@select="onSelectItem" />
			
		</div>
	</div>
</template>

<script lang="ts">
import { TwitchatAdTypes, type BingoConfig } from '@/types/TwitchatDataTypes';
import Config from '@/utils/Config';
import IRCClient from '@/utils/IRCClient';
import type { IRCEventDataList } from '@/utils/IRCEventDataTypes';
import StoreProxy from '@/utils/StoreProxy';
import TwitchCypherPlugin from '@/utils/TwitchCypherPlugin';
import TwitchUtils from '@/utils/TwitchUtils';
import VoiceAction from '@/utils/VoiceAction';
import VoiceController from '@/utils/VoiceController';
import UserSession from '@/utils/UserSession';
import { watch } from '@vue/runtime-core';
import { LoremIpsum } from "lorem-ipsum";
import { Options, Vue } from 'vue-class-component';
import Button from '../Button.vue';
import ParamItem from '../params/ParamItem.vue';
import AutocompleteChatForm from './AutocompleteChatForm.vue';
import CommercialTimer from './CommercialTimer.vue';
import CommunityBoostInfo from './CommunityBoostInfo.vue';
import TimerCountDownInfo from './TimerCountDownInfo.vue';
import TTSUtils from '@/utils/TTSUtils';
import type { TwitchDataTypes } from '@/types/TwitchDataTypes';
import VoicemodWebSocket from '@/utils/VoicemodWebSocket';
import gsap from 'gsap';
import Store from '@/store/Store';

@Options({
	props:{
		showFeed:Boolean,
		showEmotes:Boolean,
		showCommands:Boolean,
		showRewards:Boolean,
	},
	components:{
		Button,
		ParamItem,
		CommercialTimer,
		TimerCountDownInfo,
		CommunityBoostInfo,
		AutocompleteChatForm,
	},
	emits: [
		"debug",
		"ad",
		"pins",
		"poll",
		"pred",
		"clear",
		"raffle",
		"search",
		"bingo",
		"chatpoll",
		"TTuserList",
		"liveStreams",
		"showUpdates",
		"update:showFeed",
		"update:showEmotes",
		"update:showCommands",
		"update:showChatUsers",
		"update:showRewards",
		"update:showDevMenu",
		"setCurrentNotification"
	],
})
export default class ChatForm extends Vue {

	public showFeed!:boolean;
	public showEmotes!:boolean;
	public showCommands!:boolean;
	public showRewards!:boolean;

	public message = "";
	public error = false;
	public loading = false;
	public censoredViewCount = false;
	public autoCompleteSearch = "";
	public autoCompleteEmotes = false;
	public autoCompleteUsers = false;
	public autoCompleteCommands = false;
	public spamInterval = 0;
	public get maxLength():number {
		if(this.message.indexOf("/raw") === 0) {
			return 500000;
		}else{
			return 500;
		}
	}

	public get emergencyButtonEnabled():boolean {
		return StoreProxy.store.state.emergencyParams.enabled === true;
	}

	public get voiceBotStarted():boolean { return VoiceController.instance.started; }
	public get voiceBotConfigured():boolean {
		if(Config.instance.OBS_DOCK_CONTEXT) return false;
		const actions = Object.keys(VoiceAction);
		type VAKeys = keyof typeof VoiceAction;
		//Search for global labels
		for (let i = 0; i < actions.length; i++) {
			const a = actions[i];
			if(VoiceAction[a+"_IS_GLOBAL" as VAKeys] !== true) continue;
			const id:string = VoiceAction[a as VAKeys] as string;
			const action = (StoreProxy.store.state.voiceActions as VoiceAction[]).find(v=> v.id == id);
			if(!action?.sentences) return false;
		}
		return true;
	}

	public get chatHighlightEnabled():boolean {
		return StoreProxy.store.state.isChatMessageHighlighted;
	}

	public get openAutoComplete():boolean {
		return this.autoCompleteSearch.length > 1 || (this.autoCompleteCommands && this.autoCompleteSearch.length > 0);
	}

	public get onlineUsersTooltip():string {
		let res = "<img src='"+this.$image('icons/user.svg')+"' height='15px' style='vertical-align:middle'> "+StoreProxy.store.state.onlineUsers.length.toString();

		if(StoreProxy.store.state.params.appearance.highlightNonFollowers.value === true) {
			let followCount = 0;
			const followState = StoreProxy.store.state.followingStatesByNames;
			for (let i = 0; i < StoreProxy.store.state.onlineUsers.length; i++) {
				const u = StoreProxy.store.state.onlineUsers[i];
				if(followState[u.toLowerCase()] === true) followCount ++;
			}
			res += " / <img src='"+this.$image('icons/follow.svg')+"' height='15px' style='vertical-align:middle'> "+followCount.toString();
			res += " / <img src='"+this.$image('icons/unfollow_white.svg')+"' height='15px' style='vertical-align:middle'> "+(StoreProxy.store.state.onlineUsers.length - followCount).toString();
		}
		return res;
	}

	public get whispersAvailable():boolean {
		const whispers:{[key:string]:IRCEventDataList.Whisper[]} = StoreProxy.store.state.whispers;
		for (const key in StoreProxy.store.state.whispers) {
			if (whispers[key].length > 0) return true;
		}
		return false;
	}

	public get classes():string[] {
		let res = ["chatform"];
		if(this.loading) res.push("loading");
		if(StoreProxy.store.state.cypherEnabled) res.push("cypherMode");
		if(StoreProxy.store.state.emergencyModeEnabled) res.push("emergencyMode");
		return res;
	}

	public get cypherConfigured():boolean { return StoreProxy.store.state.cypherKey?.length > 0; }

	public get isCommercial():boolean { return StoreProxy.store.state.commercialEnd != 0; }
	
	public get showFeedBt():boolean {
		return StoreProxy.store.state.activityFeed?.length > 0
		&& (!StoreProxy.store.state.canSplitView || !StoreProxy.store.state.params.appearance.splitView.value);
	}

	public async mounted():Promise<void> {
		watch(():string => this.message, (newVal:string):void => {
			const input = this.$refs.input as HTMLInputElement;
			let carretPos = input.selectionStart as number | 0;
			let isCmd = /^\s*\//.test(newVal);
			
			for (let i = carretPos; i >= 0; i--) {
				const currentChar = newVal.charAt(i);
				const offset = currentChar == ":" || currentChar == "@"? 1 : 0;
				if(/\s/gi.test(currentChar)) {
					this.autoCompleteSearch = "";
					break;
				}

				if(currentChar == ":" || 
				currentChar == "@" || 
				(currentChar == "/" && carretPos == 1) || 
				(i == 0 && this.autoCompleteSearch)) {
					this.autoCompleteUsers = currentChar == "@";
					this.autoCompleteEmotes = currentChar == ":" && !isCmd;//Avoid autocompleting emotes in /countdown cmd
					this.autoCompleteCommands = currentChar == "/";
					this.autoCompleteSearch = newVal.substring(i+offset, carretPos);
					break;
				}
			}
		});

		// try {
		// 	await TwitchUtils.loadRewards();
		// }catch(e) {
		// 	//User is probably not an affiliate
		// }
		gsap.from(this.$el, {y:50, delay:.2, duration:1, ease:"sine.out"});
		const btns = (this.$el as HTMLDivElement).querySelectorAll(".leftForm>*,.inputForm>*");
		gsap.from(btns, {y:50, duration:.7, delay:.5, ease:"back.out(2)", stagger:.075});
		
	}

	public beforeUnmount():void {
		clearInterval(this.spamInterval);
	}
	
	public toggleParams():void {
		StoreProxy.store.dispatch("showParams", !StoreProxy.store.state.showParams);
	}
	
	public async sendMessage(event:Event):Promise<void> {
		if(this.message.length == 0) return;
		if(this.openAutoComplete) return;

		const params = this.message.split(" ");
		const cmd = params.shift()?.toLowerCase();

		if(cmd == "/devmode") {
			this.message = "";
			StoreProxy.store.dispatch("toggleDevMode");
		}else

		if(cmd == "/error") {
			this.message = "";
			throw(new Error("Test error"));
		}else

		if(cmd == "/chatsugg") {
			event.preventDefault();//avoid auto submit of the opening form
			//Open chat poll form
			this.$emit("chatpoll");
			this.message = "";
		}else

		if(cmd == "/poll") {
			event.preventDefault();//avoid auto submit of the opening form
			//Open poll form
			StoreProxy.store.state.tempStoreValue = params.join(" ");
			this.$emit("poll");
			this.message = "";
		}else

		if(cmd == "/prediction") {
			event.preventDefault();//avoid auto submit of the opening form
			//Open prediction form
			StoreProxy.store.state.tempStoreValue = params.join(" ");
			this.$emit("pred");
			this.message = "";
		}else

		if(cmd == "/raffle") {
			event.preventDefault();//avoid auto submit of the opening form
			//Open raffle form
			this.$emit("raffle");
			this.message = "";
		}else

		if(cmd == "/bingo") {
			//Open bingo form
			if(params[0] == "number" || params[0] == "emote") {
				const payload:BingoConfig = {
					guessNumber: params[0] == "number",
					guessEmote: params[0] == "emote",
					min: 0,
					max: 100,
				};
				StoreProxy.store.dispatch("startBingo", payload);
			}else{
				event.preventDefault();//avoid auto submit of the opening form
				this.$emit("bingo");
			}
			this.message = "";
		}else

		if(cmd == "/voice") {
			//change voicemod voice
			//TODO
			this.message = "";
		}else

		if(cmd == "/search") {
			//Search a for messages
			const search = params.join(" ");
			// this.$emit("search", search);
			StoreProxy.store.dispatch("searchMessages", search);
			this.message = "";
		}else

		if(cmd == "/so") {
			this.message = "...";
			//Make a shoutout
			await StoreProxy.store.dispatch("shoutout",params[0]);
			this.message = "";
		}else

		if(cmd == "/raid" && (!params[0] || params[0] == "user")) {
			this.$emit("liveStreams");
			this.message = "";
		}else

		if(cmd == "/spam") {
			clearInterval(this.spamInterval);
			const lorem = new LoremIpsum({
				sentencesPerParagraph: { max: 8, min: 4 },
				wordsPerSentence: { max: 8, min: 2 }
			});
			
			this.spamInterval = window.setInterval(()=> {
				const tags = IRCClient.instance.getFakeTags();
				const id = Math.round(Math.random()*1000);
				tags.username = "FakeUser"+id;//UserSession.instance.authToken.login;
				tags["display-name"] = tags.username;
				tags["user-id"] = id.toString();//UserSession.instance.authToken.user_id;
				tags.color = "#"+(id*id*id*id*id).toString().substring(0,8);
				let message = params[0]? params[0] : lorem.generateSentences(Math.round(Math.random()*2) + 1);
				if(StoreProxy.store.state.chatMessages.length > 0 && Math.random() < .5) {
					for (let i = 0; i < StoreProxy.store.state.chatMessages.length; i++) {
						const m = StoreProxy.store.state.chatMessages[i];
						if(m.type == "message") {
							tags["reply-parent-msg-id"] = m.tags.id;
							break;
						}
					}
				}
				IRCClient.instance.addMessage(message, tags, false)
			}, 250);
			this.message = "";
		}else

		if(cmd == "/spamstop") {
			clearInterval(this.spamInterval);
			this.message = "";
		}else

		if(cmd == "/commercial") {
			this.$emit("ad", params.length > 0? parseInt(params[0]) : 30);
			this.message = "";
		}else

		if(cmd == "/updates") {
			StoreProxy.store.dispatch("sendTwitchatAd", 2);
			this.message = "";
		}else

		if(cmd == "/tip") {
			StoreProxy.store.dispatch("sendTwitchatAd", TwitchatAdTypes.TIP_AND_TRICK);
			this.message = "";
		}else

		if(cmd == "/alphatest1") {
			this.$emit("debug", 1);
			this.message = "";
		}else

		if(cmd == "/alphatest2") {
			this.$emit("debug", 2);
			this.message = "";
		}else

		if(cmd == "/timerstart") {
			StoreProxy.store.dispatch("startTimer");
			this.message = "";
		}else

		if(cmd == "/timerstop") {
			StoreProxy.store.dispatch("stopTimer");
			this.message = "";
		}else

		if(cmd == "/countdown") {
			const chunks = params[0].split(/[^a-zA-ZÀ-ÖØ-öø-ÿ0-9_]+/gi);
			let duration = 0;
			for(let i = 0; i < chunks.length; i++) {
				let value = parseInt(chunks[i]);
				let coeff = chunks.length - i;
				if(coeff > 1) coeff = Math.pow(60, coeff-1);
				duration += value * coeff;
			}
			StoreProxy.store.dispatch("startCountdown", duration * 1000);
			this.message = "";
		}else

		if(cmd == "/unblock2") {
			this.message = "";
			this.loading = true;
			// for (let i = 0; i < 1000; i++) {
			// 	await TwitchUtils.unblockUser("FakeUser"+i);
			// }
			await TwitchUtils.unblockUser(params[0]);
			this.loading = false;
		}else

		if(cmd == "/block") {
			this.message = "";
			this.loading = true;
			let users = await await TwitchUtils.loadUserInfo(undefined, [params[0]]);
			if(users.length == 0) {
				await IRCClient.instance.sendNotice("error", "User <mark>"+params[0]+"</mark> not found...");
			}else{
				let res = await TwitchUtils.blockUser(users[0].id);
				if(res === true) {
					await IRCClient.instance.sendNotice("block", "User <mark>"+users[0].login+"</mark> blocked");
				}
			}
			this.loading = false;
		}else

		if(cmd == "/unblock") {
			this.message = "";
			this.loading = true;
			let users = await await TwitchUtils.loadUserInfo(undefined, [params[0]]);
			if(users.length == 0) {
				await IRCClient.instance.sendNotice("error", "User <mark>"+params[0]+"</mark> not found...");
			}else{
				let res = await TwitchUtils.unblockUser(users[0].id);
				if(res === true) {
					await IRCClient.instance.sendNotice("unblock", "User <mark>"+users[0].login+"</mark> unblocked");
				}
			}this.loading = false;
		}else
		
		if(cmd == "/userinfo") {
			if(!params[0]) {
				await IRCClient.instance.sendNotice("error", "Missing user name param");
			}else{
				if(parseInt(params[0]).toString() === params[0]) {
					const user = await TwitchUtils.loadUserInfo([params[0]]);
					params[0] = user[0].login;
				}
				StoreProxy.store.dispatch("openUserCard", params[0]);
			}
			this.message = "";
		}else
		
		if(cmd == "/cypherkey") {
			//Secret feature
			StoreProxy.store.dispatch("setCypherKey", params[0]);
			IRCClient.instance.sendNotice("cypher", "Cypher key successfully configured !");
			this.message = "";
		}else

		if(cmd == "/cypherreset") {
			//Secret feature
			StoreProxy.store.dispatch("setCypherEnabled", false);
			TwitchCypherPlugin.instance.cypherKey = "";
			IRCClient.instance.sendNotice("cypher", "Cypher key removed successfully.");
			this.message = "";
		}else
		
		if(cmd == "/version") {
			//Secret feature
			IRCClient.instance.sendNotice("version", "Twitchat version "+import.meta.env.PACKAGE_VERSION);
			this.message = "";
		}else
		
		if(cmd == "/deletemessage") {
			//Delete a chat message from its ID
			IRCClient.instance.deleteMessage(params[0]);
			this.message = "";
		}else
		
		if(cmd == "/raw") {
			//Allows to display a message on chat from its raw JSON
			console.log(params.join(""));
			try {
				IRCClient.instance.sendFakeEvent(undefined, JSON.parse(params.join("")));
			}catch(error) {
				StoreProxy.store.state.alert = "Invalid or missing JSON";
			}
			this.message = "";
		}else

		if(cmd == "/ttsoff" || cmd == "/tts") {
			this.loading = true;
			const username = params[0].toLowerCase().replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ0-9_]+/gi, "").trim();
			try {
				const user = await TwitchUtils.loadUserInfo(undefined, [username]);
				if(user.length == 0) {
					IRCClient.instance.sendNotice("error", "User <mark>"+username+"</mark> not found...");
					this.loading = false;
					return;
				}
			}catch(error) {}
			const payload = {username, read:cmd=="/tts"};
			StoreProxy.store.dispatch("ttsReadUser", payload);
			this.message = "";
			this.loading = false;
		}else

		if(cmd == "/userlist") {
			StoreProxy.store.state.tempStoreValue = params[0];
			this.$emit('TTuserList');
			this.message = "";
		}else

		if(cmd == "/userdata" || cmd == "/loaduserdata") {
			if(params.length == 0) {
				StoreProxy.store.state.alert = "Missing user name";
			}else{
				this.loading = true;
				let users:TwitchDataTypes.UserInfo[] = [];
				try {
					users = await TwitchUtils.loadUserInfo(undefined, [params[0]])
				}catch(error) {}

				if(users.length == 0) {
					StoreProxy.store.state.alert = "User not found";
				}else{
					const options = {
						method: "GET",
						headers: {
							"Content-Type": "application/json",
							"Authorization": "Bearer "+UserSession.instance.access_token as string,
						},
					}
					const res = await fetch(Config.instance.API_PATH+"/userdata?uid="+users[0].id, options)
					if(res.status === 200) {
						const json = await res.json();
						if(cmd === "/loaduserdata") {
							Store.loadFromJSON(json.data);
						}else{
							//Open JSOn on new tab
							const data = JSON.stringify(json.data);
							const blob = new Blob([data], { type: 'application/json' });
							const url = window.URL.createObjectURL(blob);
							window.open(url, "_blank");
						}
					}else{
						StoreProxy.store.state.alert = "Unable to load user data";
					}
				}
				this.loading = false;
			}
			this.message = "";
		}else
		
		{
			//Send message
			try {
				if(StoreProxy.store.state.cypherEnabled) {
					this.message = await TwitchCypherPlugin.instance.encrypt(this.message);
				}
				let mess = this.message;
				this.message = "";
				await IRCClient.instance.sendMessage(mess);
			}catch(error) {
				console.log(error);
				this.error = true;
			}
		}
	}

	/**
	 * Toggle secret cypher keyboard
	 */
	public toggleCypher():void {
		StoreProxy.store.dispatch("setCypherEnabled", !StoreProxy.store.state.cypherEnabled);
	}

	/**
	 * Start the mergency mode
	 */
	public toggleEmergencyMode():void {
		if(!StoreProxy.store.state.emergencyModeEnabled) {
			this.$confirm("Enable emergency mode ?").then(()=>{
				StoreProxy.store.dispatch("setEmergencyMode", true);
			}).catch(()=>{});
		}else{
			StoreProxy.store.dispatch("setEmergencyMode", false);
		}
	}

	/**
	 * Start the voice bot
	 */
	public toggleVoiceBot():void {
		if(VoiceController.instance.started) {
			VoiceController.instance.stop();
		}else{
			VoiceController.instance.start(false);
		}
	}

	/**
	 * Remove the currently highlighted message
	 */
	public removeChatHighlight():void {
		StoreProxy.store.dispatch("highlightChatMessageOverlay", null);
	}

	/**
	 * Called when selecting an emote/user/cmd from the emote selector
	 * or the auto complete selector
	 */
	public async onSelectItem(item:string):Promise<void> {
		const input = this.$refs.input as HTMLInputElement;
		let carretPos = input.selectionStart;
		let localMessage = this.message;
		if(!carretPos) carretPos = 1;
		carretPos --;

		if(this.autoCompleteSearch) {
			for (let i = carretPos; i >= 0; i--) {
				const currentChar = localMessage.charAt(i);
				if(currentChar == ":" || 
				currentChar == "@" ||
				/\s/gi.test(currentChar) || i == 0) {
					const offset = currentChar == ":" || currentChar == "@"? 1 : 0;
					let prefix = localMessage.substring(0, i-offset);
					const suffix = localMessage.substring(i+1+this.autoCompleteSearch.length)+" ";
					if(prefix) prefix += " ";
					localMessage = prefix + item + suffix;
					carretPos = prefix.length + item.length + 1;
					break;
				}
			}
			this.autoCompleteSearch = "";
		}else{
			const prefix = carretPos == 0 || /\s/gi.test(localMessage.charAt(carretPos))? "" : " ";
			const suffix = carretPos == localMessage.length || /\s/gi.test(localMessage.charAt(carretPos+1))? "" : " ";
			const code = prefix + item + suffix;
			localMessage = localMessage.substring(0, carretPos+1) + code + localMessage.substring(carretPos+1);
			carretPos += code.length+1;
		}
		
		if(/\{.*?\}/gi.test(item)) {
			localMessage = localMessage.replace(/{(.*?)\}/gi, "$1");
		}
		this.message = localMessage;

		await this.$nextTick();
		
		//Pre select commands placeholder
		if(/\{.*?\}/gi.test(item)) {
			input.setSelectionRange(item.indexOf("{"), item.indexOf("}"), "forward");
		}else{
			input.setSelectionRange(carretPos, carretPos, "forward");
			input.focus();
		}

		//Force autocomplete close.
		//Due to async rendering the watcher might detect search update before
		//the selectionRange is effective wich may cause the autocomplete open
		//Here we ensure it stays closed
		this.autoCompleteSearch = "";
	}

	/**
	 * Called when pressing any key
	 */
	public onKeyDown(e:KeyboardEvent):void {
		if(e.shiftKey) return;//Avoid blocking browser tab navigation
		if(e.ctrlKey) return;//Avoid blocking browser tab navigation
		//Avoid leaving the input form
		if(e.key == "Tab") e.preventDefault();

		if(!this.openAutoComplete) return;
		if(e.key == "ArrowUp" || e.key == "ArrowDown") {
			e.preventDefault();
		}
	}

	/**
	 * Called when pressing tab key on input field
	 */
	public onTab(e:KeyboardEvent):void {
		const input = this.$refs.input as HTMLInputElement;
		let carretPos = input.selectionStart as number;
		let i = carretPos - 1;
		for (; i > -1; i--) {
			const c = this.message.charAt(i);
			if(/\s/gi.test(c)) break;
		}
		const len = carretPos - i;
		if(len > 2) {
			if(!this.openAutoComplete) {
				//Avoid closing the auto complete list right away now that
				//we can submit it with the tab key
				e.stopPropagation();
			}
			this.autoCompleteUsers = true;
			this.autoCompleteEmotes = true;
			this.autoCompleteCommands = true;
			this.autoCompleteSearch = this.message.substring(i+1, carretPos);
		}
		// e.preventDefault();
	}

	/**
	 * Interrupts the TTS
	 */
	public stopTTS():void {
		TTSUtils.instance.stop();
	}

	/**
	 * Reset current voice effect
	 */
	public resetVoiceEffect():void {
		VoicemodWebSocket.instance.disableVoiceEffect();
	}

}
</script>

<style scoped lang="less">
.chatform{
	@height: 2em;
	display: flex;
	flex-direction: row;
	min-height: @height;
	margin: auto;
	position: relative;
	opacity: 1;
	transition: opacity .25s;

	&.loading {
		opacity: .5;
		pointer-events: none;
	}

	&.cypherMode {
		.holder {
			background-image: repeating-linear-gradient(-45deg, #00000020, #00000020 20px, #ffffff10 20px, #ffffff10 40px);
		}
	}
	&.emergencyMode {
		.holder {
			background-color: @mainColor_alert;
		}
	}

	.holder {
		position: absolute;
		width: 100%;
		display: flex;
		flex-direction: row;
		min-height: @height;
		margin: auto;
		position: relative;
		z-index: 2;
		box-shadow: 0px -2px 2px 0px rgba(0,0,0,1);
		background-color: @mainColor_dark_extralight;
		padding: .25em;
		border-radius: .25em;

		.leftForm {
			height: 100%;
			display: flex;
			flex-direction: row;
			.button {
				width: 1.5em;
				height: 1.5em;
				border-radius: .25em;
				background: none;
			}
		}
	
		.inputForm {
			display: flex;
			flex-direction: row;
			align-items: center;
			justify-content: center;
			flex-grow: 1;
			flex-wrap: wrap;

			.loader {
				height: 1em;
			}

			input {
				min-width: 4em;
				//These 2 following lines seems stupide AF but they allow 
				//the input to autosize to it's min length
				width: 0%;
				flex-grow: 1;
				border-top-right-radius: 0;
				border-bottom-right-radius: 0;
				background: transparent;
				border: none;
				border-radius: 0;
			}
			.error {
				cursor: pointer;
				text-align: center;
				flex-grow: 1;
				font-size: 1em;
				color: #ff0000;
			}

			.whispers, .pins {
				position: relative;
				.count {
					position: absolute;
					top: 0;
					right: 0;
					transform: translate(20%, -50%);
					border-radius: 1em;
					font-size: .55em;
					padding: .25em .5em;
					font-weight: bold;
					color: @mainColor_dark;
					background-color: @mainColor_warn;
				}
			}

			.button:not(.emergency) {
				.clearButton() !important;
				border-radius: 50%;
			}
			.button.emergency {
				margin-left: .5em;
			}

			.blink-enter-active {
				transition: all 1s;
			}

			.blink-leave-active {
				transition: all .25s;
			}
			
			.blink-enter-from {
				opacity: 1;
				background: #ffffff !important;
				transform: scale(1.5);
			}
			.blink-leave-to {
				opacity: 0;
			}

			.viewCount {
				cursor: pointer;
				display: flex;
				flex-direction: row;
				align-items: center;
				white-space: nowrap;
				color: @mainColor_light;
				background-color: rgba(255,255,255,.25);
				
				margin-left: .25em;
				border-radius: .5em;
				font-size: .7em;
				padding: .35em;
				img {
					height: .7em;
					margin-left: .1em;
				}
			}
		}
	}

	.floatingButtons {
		position: absolute;
		top: 0;
		right: 0;
		z-index: 1;
		transform: translate(0, -100%);
		display: flex;
		flex-direction: column;

		.button {
			.clearButton();
			height: auto;
			background-color: fade(@mainColor_light, 20%);
			padding: .25em;
			width: 2em;
			height: 2em;
			transform: translate(0, 0);
			transition: transform .25s;
		}

		.voicemodBt {
			padding: 0;
			background-color: #00fff6;
			&:hover {
				background-color: darken(#00fff6, 10%) !important;
			}
			:deep(.icon){
				width: 100%;
				height: 100%;
				max-height: 100%;
				max-width: 100%;
			}
		}

			.slide-enter-from,
			.slide-leave-to {
				transform: translate(100%, 0);
			}
	}

	.contentWindows {
		position: absolute;
		top: 0;
		left: 0;
		transform: translateY(-100%);
		z-index: 1;
	}

}
</style>