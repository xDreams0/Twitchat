<template>
	<div class="postonchatparam">

		<ParamItem clearToggle class="parameter" :paramData="enabledParam" ref="paramItem" :error="error != ''" />

		<div v-if="error" class="errorMessage">{{error}}</div>
		
		<PlaceholderSelector class="placeholders" v-if="placeholderTarget && placeholders && enabledParam.value===true"
			:target="placeholderTarget"
			:placeholders="placeholders"
			v-model="textParam.value"
			@change="saveParams()"
		/>
	</div>
</template>

<script lang="ts">
import type { BotMessageField, ParameterData, PlaceholderEntry } from '@/types/TwitchatDataTypes';
import StoreProxy from '@/utils/StoreProxy';
import { watch } from 'vue';
import { Options, Vue } from 'vue-class-component';
import ParamItem from './ParamItem.vue';
import PlaceholderSelector from './PlaceholderSelector.vue';

@Options({
	props:{
		title:{
			type:String,
			default:"Post winner on chat",
		},
		botMessageKey:String,
		placeholders:Object,
		icon:String,
		noToggle:{
			type:Boolean,
			default:false,
		},
		clearToggle:{
			type:Boolean,
			default:false,
		},
	},
	components:{
		ParamItem,
		PlaceholderSelector,
	}
})
export default class PostOnChatParam extends Vue {
	
	public icon!:string;
	public title!:string;
	public noToggle!:boolean;
	public botMessageKey!:BotMessageField;
	public placeholders!:PlaceholderEntry[];

	public error:string = "";
	public enabledParam:ParameterData = { label:"", value:false, type:"toggle", maxLength:500};
	public textParam:ParameterData = { label:"", value:"", type:"text", longText:true};

	public placeholderTarget:HTMLTextAreaElement|null = null;

	public async mounted():Promise<void> {
		const data					= StoreProxy.store.state.botMessages[ this.botMessageKey ];
		this.textParam.value		= data.message;
		this.enabledParam.label		= this.title;
		this.enabledParam.value		= data.enabled || this.noToggle !== false;
		this.enabledParam.children	= [this.textParam];
		this.enabledParam.noInput	= this.noToggle;
		if(this.icon) {
			this.enabledParam.icon	= this.icon;
		}

		watch(()=>this.textParam.value, ()=> this.saveParams())
		watch(()=>this.enabledParam.value, ()=> this.saveParams())

		await this.$nextTick();
		this.saveParams(false);
	}

	public async saveParams(saveToStore = true):Promise<void> {
		//Avoid useless save on mount
		if(saveToStore){
			StoreProxy.store.dispatch("updateBotMessage", {key:this.botMessageKey,
												enabled:this.enabledParam.value,
												message:this.textParam.value});
		}

		this.error = ""
		if(this.botMessageKey == "twitchatAd") {
			if(!/(^|\s|https?:\/\/)twitchat\.fr($|\s)/gi.test(this.textParam.value as string)) {
				this.error = "Message must contain \"twitchat.fr\"";
			}
		}

		if(this.enabledParam.value) {
			await this.$nextTick();
			this.placeholderTarget = (this.$refs.paramItem as ParamItem).$el.getElementsByTagName("textarea")[0];
		}
	}
}
</script>

<style scoped lang="less">
.postonchatparam{
	.placeholders {
		margin-top: .5em;
	}

	&>.errorMessage {
		background-color: @mainColor_alert;
		color:@mainColor_light;
		padding: .5em;
		font-size: .8em;
		border-radius: 0 0 .5em .5em;
		text-align: center;
		cursor: pointer;
	}
}
</style>