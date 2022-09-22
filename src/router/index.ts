import { storeMusic } from '@/internals'
import { storeMain } from '@/internals'
import type { SpotifyAuthResult } from '@/utils/SpotifyDataTypes'
import Utils from '@/utils/Utils'
import Chat from '@/views/Chat.vue'
import ChatLight from '@/views/ChatLight.vue'
import Home from '@/views/Home.vue'
import Login from '@/views/Login.vue'
import Logout from '@/views/Logout.vue'
import Overlay from '@/views/Overlay.vue'
import RemoteVoiceControl from '@/views/RemoteVoiceControl.vue'
import Sponsor from '@/views/Sponsor.vue'
import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'


const routes: Array<RouteRecordRaw> = [
	{
		path: '/',
		name: 'home',
		component: Home,
		meta: {
			overflow:true,
			needAuth:false,
		}
	},
	{
		path: '/home',
		name: 'home_forced',
		component: Home,
		meta: {
			overflow:true,
			needAuth:false,
		}
	},
	{
		path: '/chat',
		name: 'chat',
		component: Chat,
		meta: {
			needAuth:true,
		}
	},
	{
		path: '/sponsor',
		name: 'sponsor',
		component: Sponsor,
		meta: {
			overflow:true,
			needAuth:false,
		}
	},
	{
		path: '/chat/:login',
		name: 'chatLight',
		component: ChatLight,
		meta: {
			needAuth:false,
			noBG:true,
		}
	},
	{
		path: '/login',
		name: 'login',
		component: Login
	},
	{
		path: '/logout',
		name: 'logout',
		component: Logout
	},
	{
		path: '/oauth',
		name: 'oauth',
		component: Login,
	},
	{
		path: '/voice',
		name: 'voice',
		component: RemoteVoiceControl,
		meta: {
			overflow:true,
			needAuth:false,
		}
	},
	{
		path: '/spotify/auth',
		name: 'spotify/auth',
		redirect:() => {
			const sMain = storeMain();
			const sMusic = storeMusic();
			if(!Utils.getQueryParameterByName("error")) {
				sMain.showParams = true;//Open params
				sMain.tempStoreValue = "CONTENT:overlays";//Set default param tab to open
	
				const params:SpotifyAuthResult = {
					code:Utils.getQueryParameterByName("code") as string,
					csrf:Utils.getQueryParameterByName("state") as string,
				}
				sMusic.setSpotifyAuthResult(params);
			}else{
				sMain.alert = "You refused to grant access to your Spotify account";
			}
			return {name:"chat"}
		},
		meta: {
			needAuth:true,
		}
	},
	{
		path: '/overlay/:id(.*)',
		name: 'overlay',
		component: Overlay,
		meta: {
			needAuth:false,
			public:true,
			noBG:true,
			overflow:false,
		}
	},
	{
		path: "/:path(.*)",
		redirect:() => {
			return {name:"home"}
		},
	}
]

const router = createRouter({
	history: createWebHistory(),
	routes
})

export default router