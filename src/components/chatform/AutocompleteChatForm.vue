<template>
	<div class="AutocompleteChatForm">
		<div
		v-for="(i, index) in filteredItems"
		:key="i.id"
		:ref="'item_'+i.id"
		:class="getClasses(index, i)"
		@click="selectItem(i)">
			<img
				class="image"
				loading="lazy" 
				:src="'https://static-cdn.jtvnw.net/emoticons/v2/'+i.id+'/'+i.emote.format[i.emote.format.length-1]+'/dark/1.0'"
				:alt="i.label"
				:data-tooltip="i.label"
				v-if="i.type=='emote'">
			
			<img v-else-if="i.type == 'user'" class="image" src="@/assets/icons/user.svg" alt="user">

			<img v-else-if="i.type == 'cmd'" class="image" src="@/assets/icons/commands.svg" alt="user">

			<div class="name">{{i.label}}</div>
			<div class="infos" v-if="i.type == 'cmd' && i.infos">{{i.infos}}</div>
		</div>
	</div>
</template>

<script lang="ts">
import type { CommandData } from '@/types/TwitchatDataTypes';
import type { TwitchDataTypes } from '@/types/TwitchDataTypes';
import StoreProxy from '@/utils/StoreProxy';
import UserSession from '@/utils/UserSession';
import { watch } from '@vue/runtime-core';
import { Options, Vue } from 'vue-class-component';

@Options({
	props:{
		emotes:Boolean,
		users:Boolean,
		commands:Boolean,
		search:String,
	},
	components:{},
	emits:["select", "close"]
})
/**
 * This component is used to select an emote by typing ":xxx" on the
 * message field.
 */
export default class AutocompleteChatForm extends Vue {
	
	public search!:string;
	public emotes!:boolean;
	public users!:boolean;
	public commands!:boolean;

	public selectedIndex = 0;
	public filteredItems:ListItem[] = [];

	public getClasses(index:number, item:ListItem):string[] {
		let res = ["item"];
		if(index == this.selectedIndex) res.push('selected');
		res.push(item.type);
		return res;
	}

	private keyDownHandler!:(e:KeyboardEvent) => void;

	public mounted():void {
		this.selectedIndex = 0;
		this.keyDownHandler = (e:KeyboardEvent)=> this.onkeyDown(e);
		document.addEventListener("keydown", this.keyDownHandler);
		watch(()=>this.search, ()=>{
			this.onSearchChange();
		});
		this.onSearchChange();
	}

	public beforeUnmount():void {
		document.removeEventListener("keydown", this.keyDownHandler);
	}

	public selectItem(item:ListItem):void {
		if(item.type == "cmd") {
			this.$emit("select", item.cmd);
		}else{
			const prefix = (item.type == "user")? "@": "";
			this.$emit("select", prefix + item.label);
		}
	}

	public onkeyDown(e:KeyboardEvent):void {
		switch(e.key) {
			case "Escape":
				this.$emit("close");
				break;
			case "PageUp":
				this.selectedIndex -= 10;
				e.preventDefault();
				break;
			case "PageDown":
				this.selectedIndex += 10;
				e.preventDefault();
				break;
			case "ArrowUp":
				this.selectedIndex --;
				e.preventDefault();
				break;
			case "ArrowDown":
				this.selectedIndex ++;
				e.preventDefault();
				break;
			case "Tab":
			case "Enter": {
				e.preventDefault();
				e.stopPropagation();
				this.selectItem(this.filteredItems[this.selectedIndex]);
				break;
			}
		}
		
		const len = this.filteredItems.length;
		this.selectedIndex = this.selectedIndex%len;
		if(this.selectedIndex < 0) this.selectedIndex = len-1;
		let el = this.$refs["item_"+this.filteredItems[this.selectedIndex].id] as HTMLElement[];
		if(el.length > 0) {
			el[0].scrollIntoView({block: "center", inline: "nearest"});
		}
	}

	private onSearchChange():void {
		let res:ListItem[] = [];
		const s = this.search.toLowerCase();
		if(s?.length > 0) {
			if(this.users) {
				const users = StoreProxy.store.state.onlineUsers as string[];
				for (let j = 0; j < users.length; j++) {
					const userName = users[j];
					if(userName.toLowerCase().indexOf(s) == 0) {
						res.push({
							type:"user",
							label:userName,
							id:userName,
						});
					}
				}
			}

			if(this.emotes) {
				const emotes = UserSession.instance.emotesCache;
				if(emotes) {
					for (let j = 0; j < emotes.length; j++) {
						const e = emotes[j] as TwitchDataTypes.Emote;
						if(e.name.toLowerCase().indexOf(s) > -1) {
							res.push({
								type:"emote",
								label:e.name,
								emote:e,
								id:e.id,
							});
						}
					}
				}
			}

			if(this.commands) {
				const cmds = StoreProxy.store.state.commands;
				for (let j = 0; j < cmds.length; j++) {
					const e = cmds[j] as CommandData;
					if(e.cmd.toLowerCase().indexOf(s) > -1) {
						if(e.needTTS === true && !StoreProxy.store.state.ttsParams.enabled) continue;
						if(e.needChannelPoints === true && !StoreProxy.store.state.hasChannelPoints) continue;
						res.push({
							type:"cmd",
							label:e.cmd.replace(/{(.*?)\}/gi, "$1"),
							cmd:e.cmd,
							infos:e.details,
							id:e.id,
						});
					}
				}
			}

			this.filteredItems = res;
		}
		
		if(this.filteredItems.length == 0) {
			this.$emit("close");
		}
	}
}

export type ListItem = UserItem | EmoteItem | CommandItem;

interface UserItem {
	type:"user";
	id:string;
	label:string;
}

interface EmoteItem {
	type:"emote";
	id:string;
	label:string;
	emote:TwitchDataTypes.Emote;
}

interface CommandItem {
	type:"cmd";
	id:string;
	label:string;
	cmd:string;
	infos:string;
}
</script>

<style scoped lang="less">
.AutocompleteChatForm{
	padding: 10px;
	background-color: @mainColor_dark;
	box-shadow: 0px 0px 20px 0px rgba(0,0,0,1);
	border-radius: 10px;
	max-width: 100%;
	display: flex;
	flex-direction: column;
	transform-origin: bottom center;
	left: auto;
	margin-left: auto;
	right: 0;
	overflow-x: hidden;
	overflow-y: auto;

	max-height: 80vh;

	.item {
		display: flex;
		flex-direction: row;
		align-items: center;
		cursor: pointer;

		&.selected, &:hover {
			background-color: fade(@mainColor_light, 20%);
		}

		&.cmd {
			// display: flex;
			// flex-direction: row;
			// justify-content: space-between;
			// align-items: center;
			.name {
				flex-grow: 1;
				white-space: nowrap;
				margin-right: 5px;
			}
			.image {
				padding: 5px;
			}
		}

		.name {
			color: #fff;
			font-size: 14px;
		}

		.infos {
			color: fade(#fff, 70%);
			font-size: 12px;
			font-style: italic;
			text-align: right;
			padding-right: 5px;
		}

		.image {
			height: 33px;
			width: 33px;
			padding: 3px;
			object-fit: contain;
			margin-right: 10px;
		}
	}
}
</style>