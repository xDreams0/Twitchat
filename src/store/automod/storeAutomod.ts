import { DataStore } from "@/internals";
import type { TwitchatDataTypes } from '@/internals'
import { defineStore } from 'pinia'

export const storeAutomod = defineStore('automod', {
	state: () => ({
		params:{
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
		} as TwitchatDataTypes.AutomodParamsData
	}),



	getters: {
	},



	actions: {
		setAutomodParams(payload:TwitchatDataTypes.AutomodParamsData) {
			this.params = payload;
			DataStore.set(DataStore.AUTOMOD_PARAMS, payload);
		},
	},
})