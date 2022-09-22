import { DataStore } from "@/internals";
import type { TwitchatDataTypes } from '@/internals';
import SchedulerHelper from '@/utils/SchedulerHelper';
import { TriggerTypes } from '@/internals';
import TriggerActionHandler from '@/utils/TriggerActionHandler';
import { defineStore } from 'pinia';

export const storeTriggers = defineStore('triggers', {
	state: () => ({
		triggers: {} as {[key:string]:TwitchatDataTypes.TriggerData},
	}),



	getters: {
	},



	actions: {
		setTrigger(key:string, data:TwitchatDataTypes.TriggerData) {
			if(!key) return;
			key = key.toLowerCase();

			//remove incomplete entries
			function cleanEmptyActions(actions:TwitchatDataTypes.TriggerActionTypes[]):TwitchatDataTypes.TriggerActionTypes[] {
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
			if(key.indexOf(TriggerTypes.CHAT_COMMAND+"_") === 0
			|| key.indexOf(TriggerTypes.SCHEDULE+"_") === 0) {
				if(data.name) {
					//If name has been changed, cleanup the previous one from storage
					if(data.prevKey) {
						delete this.triggers[data.prevKey.toLowerCase()];
						//Update trigger dependencies if any is pointing
						//to the old trigger's name
						for (const key in this.triggers) {
							if(key == key) continue;
							const t = this.triggers[key];
							for (let i = 0; i < t.actions.length; i++) {
								const a = t.actions[i];
								if(a.type == "trigger") {
									//Found a trigger dep' pointing to the old trigger's name,
									//update it with the new name
									if(a.triggerKey === data.prevKey) {
										a.triggerKey = key;
									}
								}
							}
						}
						//If it is a schedule
						if(key.split("_")[0] === TriggerTypes.SCHEDULE) {
							//Remove old one from scheduling
							SchedulerHelper.instance.unscheduleTrigger(data.prevKey);
						}
						delete data.prevKey;
					}
					// if(data.actions.length == 0) remove = true;
				}else{
					//Name not defined, don't save it
					delete this.triggers[key.toLowerCase()];
					return;
				}
			}else{
				if(data.actions.length == 0) remove = true;
			}
			if(remove) {
				delete this.triggers[key.toLowerCase()];
			}else{
				data.actions = cleanEmptyActions(data.actions);
				this.triggers[key.toLowerCase()] = data;
			}

			//If it is a schedule trigger add it to the scheduler
			if(key.split("_")[0] === TriggerTypes.SCHEDULE) {
				SchedulerHelper.instance.scheduleTrigger(key, data.scheduleParams!);
			}

			DataStore.set(DataStore.TRIGGERS, this.triggers);
			TriggerActionHandler.instance.triggers = this.triggers;
		},

		deleteTrigger(key:string) {
			key = key.toLowerCase();
			if(this.triggers[key]) {
				delete this.triggers[key];
				DataStore.set(DataStore.TRIGGERS, this.triggers);
			}
		},
	},
})