<template>
	<div class="chatmessageinfos">
		<div v-for="i in infos" :class="['item', i.type].join(' ')" :data-tooltip="i.tooltip">
			<img :src="getIcon(i)" alt="emergency" v-if="getIcon(i)"> {{getLabel(i)}}
		</div>
	</div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import type { ChatMessageInfoData, ChatMessageInfoDataStringType } from "@/types/TwitchatDataTypes";

@Options({
	props:{
		infos:Object,
	},
	components:{}
})
export default class ChatMessageInfos extends Vue {

	public infos!:ChatMessageInfoData[];

	public mounted():void {
		
	}

	public getLabel(info:ChatMessageInfoData):string {
		if(info.label) return info.label;
		const hashmap:{[key in ChatMessageInfoDataStringType]:string} = {
			automod:"automod",
			whisper:"whisper",
			emergencyBlocked:"blocked",
		}
		if(hashmap[info.type]) return hashmap[info.type];
		return info.type;
	}

	public getIcon(info:ChatMessageInfoData):string {
		const hashmap:{[key:string]:string} = {
			emergencyBlocked:"emergency",
		};
		if(hashmap[info.type]) {
			return this.$image("icons/"+hashmap[info.type]+".svg");
		}
		return "";
	}

}
</script>

<style scoped lang="less">
.chatmessageinfos{
	display: inline-flex;
	flex-direction: row;
	align-items: center;
	justify-content: center;

	.item {
		font-size: .9em;
		border-radius: 3px;
		padding: .15em .3em;
		margin-right: 5px;
		vertical-align: middle;
		color: @mainColor_light;
		background-color: @mainColor_normal;
		white-space: nowrap;
		display: inline;
		cursor: default;

		&.whisper {
			color: @mainColor_dark;
			background-color: @mainColor_light;
		}

		&.automod, &.emergencyBlocked {
			background-color: @mainColor_alert;
		}

		img {
			height: 1em;
			vertical-align: middle;
		}
	}
}
</style>