<template>
	<div class="parameters">
		<div class="dimmer" ref="dimmer" @click="close()"></div>
		<div class="holder" ref="holder">
			<div class="head">
				<Button aria-label="Back to menu" :icon="$image('icons/back_purple.svg')" @click="back()" class="bt clearButton" bounce v-if="content != null" />
				<h1 class="title">Parameters</h1>
				<Button aria-label="Close parameters" :icon="$image('icons/cross.svg')" @click="close()" class="bt clearButton" bounce />
			</div>

			<div class="search" v-if="content == null">
				<input type="text" placeholder="Search a parameter..." v-model="search" v-autofocus>
			</div>
			
			<div class="content menu" v-if="content == null && !search">
				<div class="ad" v-if="!isDonor">
					<div class="row">
						<img src="@/assets/icons/twitchat.svg" alt="twitchat" style="height:2em;">
						<Button class="donateBt" white small :icon="$image('icons/info_purple.svg')"
							@click="showAdInfo=true"
							title="Disable this ad"
							v-if="!showAdInfo" />
						<div v-if="showAdInfo" class="donateDetails">
							<p class="title">To disable this ad, make any donation :)</p>
							<p class="details">Please specify your twitch profile on your donation details when possible so I can disable ads for your account. Or DM me on <a href="https://twitch.tv/durss" target="_blank" aria-label="DM me on twitter">Twitch</a>, <a href="https://discord.com/users/612270129652301838" target="_blank" aria-label="DM me on discord">Discord <i>(Durss#9864)</i></a> or <a href="https://twitter.com/_durss" target="_blank" aria-label="DM me on twitter">Twitter</a></p>
							<Button class="donateBt" white small :icon="$image('icons/coin_purple.svg')" @click="setContent(contentSponsor)" title="Donate 💝" />
						</div>
						<PostOnChatParam
							botMessageKey="twitchatAd"
							:noToggle="true"
							title="The following message will be posted on your chat every 2 hours (if you received at least 100 messages)"
						/>
						<ToggleBlock class="tip" :open="false" title="Can this message be sent by nightbot / wizebot / ... ? " small>
							Yes.<br>
							<br>
							By default the message is posted with your account.<br>
							But you can configure any other bot to send that message if you wish.<br>
							<br>
							Twitchat won't send the message as long as a message containing <strong>twitchat.fr</strong> is sent on the chat by anyone at least every 2h.<br>
							<br>
							The 2h timer starts when Twitchat is opened and reset to zero anytime a message containing <strong>twitchat.fr</strong> is received.
						</ToggleBlock>
					</div>
				</div>

				<Button bounce white :icon="$image('icons/params_purple.svg')" title="Features" @click="setContent(contentFeatures)" />
				<Button bounce white :icon="$image('icons/show_purple.svg')" title="Appearance" @click="setContent(contentAppearance)" />
				<Button bounce white :icon="$image('icons/filters_purple.svg')" title="Filters" @click="setContent(contentFilters)" />
				<Button bounce white :icon="$image('icons/emergency_purple.svg')" title="Emergency button" @click="setContent(contentEmergency)" />
				<Button class="beta1" bounce white :icon="$image('icons/mod_purple.svg')" title="Automod messages" @click="setContent(contentAutomod)" />
				<Button class="beta2" bounce white :icon="$image('icons/voice_purple.svg')" title="Voice control" @click="setContent(contentVoice)" />
				<Button class="beta2" bounce white :icon="$image('icons/tts_purple.svg')" title="Text to speech" @click="setContent(contentTts)" />
				<Button bounce white :icon="$image('icons/overlay_purple.svg')" title="Overlays" @click="setContent(contentOverlays)" />
				<Button bounce white :icon="$image('icons/broadcast_purple.svg')" title="Triggers" @click="setContent(contentTriggers)" />
				<Button bounce white :icon="$image('icons/obs_purple.svg')" title="OBS" @click="setContent(contentObs)" />
				<Button class="beta2" bounce white :icon="$image('icons/voicemod_purple.svg')" title="Voicemod" @click="setContent(contentVoicemod)" />
				<Button bounce white :icon="$image('icons/elgato_purple.svg')" title="Stream Deck" @click="setContent(contentStreamdeck)" />
				<Button bounce white :icon="$image('icons/user_purple.svg')" title="Account" @click="setContent(contentAccount)" />
				<Button bounce white :icon="$image('icons/info_purple.svg')" title="About" @click="setContent(contentAbout)" />

				<div class="ad" v-if="isDonor">
					<PostOnChatParam class="row"
						clearToggle
						icon="twitchat.svg"
						botMessageKey="twitchatAd"
						title="Share a Twitchat link every 2 hours on your chat (if you received at least 100 messages)"
					/>
				</div>

				<div class="version">v {{appVersion}}</div>
			</div>
			
			<div class="content" v-if="content != null || search">
				<ParamsList v-if="(content && isGenericListContent) || filteredParams.length > 0" :category="content" :filteredParams="filteredParams" @setContent="setContent" />
				<ParamsStreamdeck v-if="content == contentStreamdeck" @setContent="setContent" />
				<ParamsOBS v-if="content == contentObs" @setContent="setContent" />
				<ParamsEmergency v-if="content == contentEmergency" @setContent="setContent" />
				<ParamsTTS v-if="content == contentTts" @setContent="setContent" />
				<ParamsSpoiler v-if="content == contentSpoiler" @setContent="setContent" />
				<ParamsAlert v-if="content == contentAlert" @setContent="setContent" />
				<ParamsAccount v-if="content == contentAccount" @setContent="setContent" />
				<ParamsAbout v-if="content == contentAbout" @setContent="setContent" />
				<ParamsOverlays v-if="content == contentOverlays" @setContent="setContent" />
				<ParamsTriggers v-if="content == contentTriggers" @setContent="setContent" />
				<ParamsVoiceBot v-if="content == contentVoice" @setContent="setContent" />
				<ParamsVoicemod v-if="content == contentVoicemod" @setContent="setContent" />
				<ParamsAutomod v-if="content == contentAutomod" @setContent="setContent" />
				<!-- Used for direct link to sponsor content from chat ads -->
				<ParamsSponsor v-if="content == contentSponsor" @setContent="setContent" />

				<div class="searchResult" v-if="search">
					<div class="noResult" v-if="filteredParams.length == 0">No result</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { ParamsContentType, type ParameterCategory, type ParameterData, type ParamsContentStringType } from '@/types/TwitchatDataTypes';
import StoreProxy from '@/utils/StoreProxy';
import { watch } from '@vue/runtime-core';
import gsap from 'gsap';
import { Options, Vue } from 'vue-class-component';
import Button from '../Button.vue';
import ToggleButton from '../ToggleButton.vue';
import ParamsAbout from './contents/ParamsAbout.vue';
import ParamsAccount from './contents/ParamsAccount.vue';
import ParamsAlert from './contents/ParamsAlert.vue';
import ParamsEmergency from './contents/ParamsEmergency.vue';
import ParamsList from './contents/ParamsList.vue';
import ParamsOBS from './contents/ParamsOBS.vue';
import ParamsOverlays from './contents/ParamsOverlays.vue';
import ParamsSpoiler from './contents/ParamsSpoiler.vue';
import ParamsSponsor from './contents/ParamsSponsor.vue';
import ParamsStreamdeck from './contents/ParamsStreamdeck.vue';
import ParamsTriggers from './contents/ParamsTriggers.vue';
import ParamsTTS from './contents/ParamsTTS.vue';
import ParamsVoiceBot from './contents/ParamsVoiceBot.vue';
import ParamItem from './ParamItem.vue';
import ParamsVoicemod from './contents/ParamsVoicemod.vue';
import ParamsAutomod from './contents/ParamsAutomod.vue';
import UserSession from '@/utils/UserSession';
import PostOnChatParam from './PostOnChatParam.vue';
import ToggleBlock from '../ToggleBlock.vue';

@Options({
	props:{},
	components:{
		Button,
		ParamItem,
		ParamsOBS,
		ParamsTTS,
		ParamsList,
		ParamsAbout,
		ParamsAlert,
		ToggleBlock,
		ToggleButton,
		ParamsAutomod,
		ParamsSpoiler,
		ParamsAccount,
		ParamsSponsor,
		ParamsOverlays,
		ParamsTriggers,
		ParamsVoiceBot,
		ParamsVoicemod,
		ParamsEmergency,
		PostOnChatParam,
		ParamsStreamdeck,
	}
})

export default class Parameters extends Vue {

	public search = "";
	public showMenu = false;
	public filteredParams:ParameterData[] = [];
	public content:ParamsContentStringType = null;
	public showAdInfo:boolean = false;

	private prevContent:ParamsContentStringType = null;
	

	public get isDonor():boolean { return UserSession.instance.isDonor; }
	public get contentAppearance():ParamsContentStringType { return ParamsContentType.APPEARANCE; } 
	public get contentFilters():ParamsContentStringType { return ParamsContentType.FILTERS; } 
	public get contentAccount():ParamsContentStringType { return ParamsContentType.ACCOUNT; } 
	public get contentAbout():ParamsContentStringType { return ParamsContentType.ABOUT; } 
	public get contentFeatures():ParamsContentStringType { return ParamsContentType.FEATURES; } 
	public get contentObs():ParamsContentStringType { return ParamsContentType.OBS; } 
	public get contentVoicemod():ParamsContentStringType { return ParamsContentType.VOICEMOD; } 
	public get contentSponsor():ParamsContentStringType { return ParamsContentType.SPONSOR; } 
	public get contentStreamdeck():ParamsContentStringType { return ParamsContentType.STREAMDECK; } 
	public get contentTriggers():ParamsContentStringType { return ParamsContentType.TRIGGERS; } 
	public get contentOverlays():ParamsContentStringType { return ParamsContentType.OVERLAYS; } 
	public get contentEmergency():ParamsContentStringType { return ParamsContentType.EMERGENCY; } 
	public get contentSpoiler():ParamsContentStringType { return ParamsContentType.SPOILER; } 
	public get contentAlert():ParamsContentStringType { return ParamsContentType.ALERT; } 
	public get contentTts():ParamsContentStringType { return ParamsContentType.TTS; } 
	public get contentVoice():ParamsContentStringType { return ParamsContentType.VOICE; } 
	public get contentAutomod():ParamsContentStringType { return ParamsContentType.AUTOMOD; } 

	/**
	 * If true, will display a search field at the top of the view to
	 * search params by their labels
	 */
	public get isGenericListContent():boolean {
		return this.content == "features"
			|| this.content == "appearance"
			|| this.content == "filters"
			|| this.search.length>0;
	}

	public get appVersion():string { return import.meta.env.PACKAGE_VERSION; }

	public async beforeMount():Promise<void> {
		const v = StoreProxy.store.state.tempStoreValue as string;
		if(!v) return;
		if(v.indexOf("CONTENT:") === 0) {
			//Requesting sponsor page
			let pageId = v.replace("CONTENT:", "") as ParamsContentStringType;
			if(pageId == ParamsContentType.MAIN_MENU) pageId = null;
			this.content = pageId;

		}else if(v.indexOf("SEARCH:") === 0) {
			//Prefilled search
			const chunks = v.replace("SEARCH:", "").split(".");
			if(chunks.length == 2) {
				const cat = chunks[0] as ParameterCategory;
				const paramKey = chunks[1];
				this.search = StoreProxy.store.state.params[cat][paramKey].label;
			}
		}
		StoreProxy.store.state.tempStoreValue = null;
	}

	public async mounted():Promise<void> {
		watch(() => this.content, () => {
			if(this.content) this.filteredParams = [];
		});

		watch(() => this.search, (value:string) => {
			this.content = null;
			this.filterParams(this.search);
		});

		await this.$nextTick();
	
		gsap.set(this.$refs.holder as HTMLElement, {marginTop:0, opacity:1});
		gsap.to(this.$refs.dimmer as HTMLElement, {duration:.25, opacity:1});
		gsap.from(this.$refs.holder as HTMLElement, {duration:.25, marginTop:-100, opacity:0, ease:"back.out"});
		
		if(this.search) {
			await this.$nextTick();
			this.content = null;
			this.filterParams(this.search);
		}
	}

	public async close():Promise<void> {
		gsap.killTweensOf([this.$refs.holder, this.$refs.dimmer]);
		gsap.to(this.$refs.dimmer as HTMLElement, {duration:.25, opacity:0, ease:"sine.in"});
		gsap.to(this.$refs.holder as HTMLElement, {duration:.25, marginTop:-100, opacity:0, ease:"back.in", onComplete:()=> {
			this.showMenu = false;
			this.filteredParams = [];
			StoreProxy.store.dispatch("showParams", false);
		}});
	}

	public back():void {
		this.content = this.prevContent;
		this.prevContent = null;
	}

	public setContent(id:ParamsContentStringType):void {
		this.prevContent = this.content;
		if(id == this.content) {
			//Refresh content if already active
			this.content = null;
			this.$nextTick().then(()=>{
				this.content = id;
			})
		}else{
			this.content = id;
		}
		if(id == null && this.search.length > 0) {
			this.search = "";
		}
	}

	public async filterParams(search:string):Promise<void> {
		this.filteredParams = [];
		const safeSearch = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
		const IDsDone:{[key:number]:boolean} = {};
		for (const categoryID in StoreProxy.store.state.params) {
			const category = StoreProxy.store.state.params[categoryID as ParameterCategory] as {[ley:string]:ParameterData};
			for (const prop in category) {
				const data:ParameterData = category[prop];
				
				//Already done (via its parent probably), ignore it
				if(IDsDone[data.id as number] === true) continue;

				if(new RegExp(safeSearch, "gi").test(data.label)) {
					if(data.parent) {
						for (const key in category) {
							if(category[key].id == data.parent && IDsDone[category[key].id as number] !== true) {
								IDsDone[category[key].id as number] = true;
								this.filteredParams.push(category[key]);
							}
						}
					}else{
						IDsDone[data.id as number] = true;
						this.filteredParams.push(data);
					}
				}
			}
		}
	}
}
</script>

<style scoped lang="less">
.parameters{
	.modal();

	.holder {
		top: 0;
		transform: translate(-50%, 0);
		z-index: 2;

		.head {
			border-bottom: 1px solid @mainColor_normal;
			padding-bottom: .5em;
		}

		.ad {
			color: @mainColor_light;
			background-color: @mainColor_normal_light;
			margin: 0;
			margin-top: 1em;
			padding: 1em;
			border-radius: 1em;
			&:first-child {
				margin-top: 0;
				margin-bottom: .5em;
			}
			img {
				display: block;
				margin: auto;
			}
			.title {
				text-align: center;
				font-weight: bold;
			}
			.details {
				font-size: .8em;
			}
			.donateBt {
				display: block;
				margin: .5em auto;
			}
			.donateDetails {
				display: block;
				margin: .5em auto;
			}
			.tip {
				margin-top: 1em;
			}
			
			a {
				color:@mainColor_warn_extralight;
			}
		}

		.menu {
			padding: 1em;
			display: flex;
			flex-direction: column;
			flex-grow: 1;
			.button {
				box-shadow: 0px 1px 1px rgba(0,0,0,0.25);
				&:not(:first-child) {
					margin-top: 10px;
				}

				&.beta1, &.beta2 {
					&::before {
						content: "beta";
						position: absolute;
						left: 0;
						color:@mainColor_light;
						background-color: @mainColor_normal;
						background: linear-gradient(-90deg, fade(@mainColor_normal, 0) 0%, fade(@mainColor_normal, 100%) 30%, fade(@mainColor_normal, 100%) 100%);
						height: 100%;
						display: flex;
						align-items: center;
						padding: 0 1em 0 .35em;
						font-size: .8em;
						font-family: "Nunito";
						text-transform: uppercase;
					}
					&.beta2 {
						&::before {
							background: linear-gradient(-90deg, fade(@mainColor_normal, 0) 0%, fade(@mainColor_normal, 50%) 30%, fade(@mainColor_normal, 50%) 100%);
						}
					}
				}
			}

			.version {
				font-style: italic;
				text-align: center;
				font-size: .8em;
				margin-top: 1em;
			}
		}

		.search{
			margin:auto;
			margin-top: 1em;
			z-index: 1;
			input {
				text-align: center;
			}
		}

		.searchResult {
			.noResult {
				text-align: center;
				font-style: italic;
			}
		}

		.content {
			//This avoids black space over sticky items inside the content
			padding: 20px;
		}
	}

	.dimmer {
		z-index: 1;
	}

}
</style>