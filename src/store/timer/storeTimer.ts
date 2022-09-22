import { storeChat } from "@/internals";
import type { TwitchatDataTypes } from '@/internals';
import IRCClient from '@/utils/IRCClient';
import type { IRCEventDataList } from '@/utils/IRCEventDataTypes';
import PublicAPI from '@/utils/PublicAPI';
import TriggerActionHandler from '@/utils/TriggerActionHandler';
import TwitchatEvent from '@/utils/TwitchatEvent';
import { defineStore } from 'pinia';
import type { JsonObject } from 'type-fest';

export const storeTimer = defineStore('timer', {
	state: () => ({
		timerStart: 0,
		countdown: null as TwitchatDataTypes.CountdownData|null,
	}),



	getters: {
	},



	actions: {

		startTimer() {
			this.timerStart = Date.now();
			const data = { startAt:this.timerStart };
			PublicAPI.instance.broadcast(TwitchatEvent.TIMER_START, data);

			const message:IRCEventDataList.TimerResult = {
				type:"timer",
				started:true,
				markedAsRead:false,
				data:{
					startAt:Date.now(),
					duration:Date.now() - this.timerStart,
				},
			};
			console.log(message);
			TriggerActionHandler.instance.onMessage(message);
		},

		stopTimer() {
			const data = { startAt:this.timerStart, stopAt:Date.now() };
			PublicAPI.instance.broadcast(TwitchatEvent.TIMER_STOP, data);

			const message:IRCEventDataList.TimerResult = {
				type:"timer",
				started:false,
				markedAsRead:false,
				data:{
					startAt:Date.now(),
					duration:Date.now() - this.timerStart,
				},
			};
			TriggerActionHandler.instance.onMessage(message);

			this.timerStart = -1;
		},

		startCountdown(duration:number) {
			let timeout = setTimeout(()=> {
				this.stopCountdown()
			}, Math.max(duration, 1000));

			if(this.countdown) {
				clearTimeout(this.countdown.timeoutRef);
			}

			this.countdown = {
				timeoutRef:timeout,
				startAt:Date.now(),
				duration:duration,
			};

			const message:IRCEventDataList.CountdownResult = {
				type:"countdown",
				started:true,
				data:this.countdown as TwitchatDataTypes.CountdownData,
				tags: {
					id:IRCClient.instance.getFakeGuid(),
					"tmi-sent-ts": Date.now().toString()
				},
			};
			TriggerActionHandler.instance.onMessage(message);
			
			const data = { startAt:this.countdown.startAt, duration:this.countdown.duration };
			PublicAPI.instance.broadcast(TwitchatEvent.COUNTDOWN_START, data);
		},

		stopCountdown() {
			if(this.countdown) {
				clearTimeout(this.countdown.timeoutRef);
			}

			const message:IRCEventDataList.CountdownResult = {
				type:"countdown",
				started:false,
				data:JSON.parse(JSON.stringify(this.countdown)) as TwitchatDataTypes.CountdownData,
				tags: {
					id:IRCClient.instance.getFakeGuid(),
					"tmi-sent-ts": Date.now().toString()
				},
			};
			TriggerActionHandler.instance.onMessage(message);
			storeChat().addChatMessage(message);

			const data = { startAt:this.countdown?.startAt, duration:this.countdown?.duration };
			PublicAPI.instance.broadcast(TwitchatEvent.COUNTDOWN_COMPLETE, (data as unknown) as JsonObject);

			this.countdown = null;
		},
	},
})