<template>
	<div class="triggeractionhighlightentry">
		<div class="item">You need to configure the <strong>"Message highlight"</strong> overlay to use this action.</div>
		<ParamItem class="item show" :paramData="show_conf" v-model="action.show" />
		<ParamItem class="item" v-if="show_conf.value === true" :paramData="message_conf" ref="textContent" v-model="action.text" />
	</div>
</template>

<script lang="ts">
import type { ParameterData, ParameterDataListValue, TriggerActionHighlightData, TriggerEventTypes } from '@/types/TwitchatDataTypes';
import { TriggerActionHelpers } from '@/utils/TriggerActionData';
import { Options, Vue } from 'vue-class-component';
import ParamItem from '../../../ParamItem.vue';


@Options({
	props:{
		action:Object,
		event:Object,
	},
	components:{
		ParamItem,
	},
	emits:["update"]
})
export default class TriggerActionHighlightEntry extends Vue {

	public action!:TriggerActionHighlightData;
	public event!:TriggerEventTypes;

	private showHideValues:ParameterDataListValue[] = [
		{label:"Hide", value:false},
		{label:"Show", value:true},
	];
	
	public show_conf:ParameterData = { label:"Highlight visibility", type:"list", value:this.showHideValues[1].value, listValues:this.showHideValues, icon:"show_purple.svg" };
	public message_conf:ParameterData = { label:"Message to send on your stream", type:"text", longText:true, value:"", icon:"highlight_purple.svg", maxLength:500};
	
	public beforeMount():void {
		if(this.action.show == undefined) this.action.show = true;
		this.message_conf.placeholderList = TriggerActionHelpers(this.event.value);
	}

}
</script>

<style scoped lang="less">
.triggeractionhighlightentry{
	.item {
		margin-bottom: .25em;
	}
}
</style>