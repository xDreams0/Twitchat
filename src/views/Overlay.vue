<template>
	<div :class="classes">
		<OverlaysRaffleWheel v-if="overlay=='wheel' || overlay=='unified'" />
		<OverlayMusicPlayer class="music" v-if="overlay=='music' || overlay=='unified'" :embed="overlay=='unified'" keepEmbedTransitions />
		<OverlayTimer v-if="overlay=='timer' || overlay=='unified'" />
		<OverlayChatHighlight v-if="overlay=='chathighlight' || overlay=='unified'" />
	</div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import OverlayMusicPlayer from '../components/overlays/OverlayMusicPlayer.vue';
import OverlaysRaffleWheel from '../components/overlays/OverlaysRaffleWheel.vue';
import OverlayTimer from '../components/overlays/OverlayTimer.vue';
import OverlayChatHighlight from '../components/overlays/OverlayChatHighlight.vue';

@Options({
	props:{},
	components:{
		OverlayTimer,
		OverlayMusicPlayer,
		OverlaysRaffleWheel,
		OverlayChatHighlight,
	}
})
export default class Overlay extends Vue {

	public overlay = "";

	public get classes():string[] {
		const res:string[] = ["overlay"];
		if(this.overlay == "unified") res.push("unified")
		return res;
	}

	public mounted():void {
		this.overlay = this.$router.currentRoute.value.params.id as string;
	}

}
</script>

<style scoped lang="less">
.overlay{
	height: 100%;

	&.unified {
		.music {
			position: absolute;
			bottom: 0;
			right: 0;
			max-width: 20vw;
			height: 10vh;
			min-width: 200px;
			min-height: 80px;
		}
	}
}
</style>