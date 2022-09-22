import type { TwitchatDataTypes } from '@/internals'
import { defineStore } from 'pinia'

export const storeChatSuggestion = defineStore('chatSuggestion', {
	state: () => ({
		data: null as TwitchatDataTypes.ChatSuggestionData | null,
	}),



	getters: {
	},



	actions: {
		
		setChatSuggestion(payload:TwitchatDataTypes.ChatSuggestionData|null) { this.data = payload; },
	},
})