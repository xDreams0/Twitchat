<template>
	<div class="chatraffleresult" @click.ctrl="copyJSON()">
		<span class="time" v-if="$store.state.params.appearance.displayTime.value">{{time}}</span>
		<img src="@/assets/icons/ticket.svg" alt="icon" class="icon">
		<div>
			<strong>{{raffleData.winner.label}}</strong> won the raffle
		</div>
	</div>
</template>

<script lang="ts">
import type { IRCEventDataList } from '@/utils/IRCEventDataTypes';
import Utils from '@/utils/Utils';
import gsap from 'gsap';
import { Options, Vue } from 'vue-class-component';

@Options({
	props:{
		raffleData:Object,
	},
	components:{}
})
export default class ChatRaffleResult extends Vue {

	public raffleData!:IRCEventDataList.RaffleResult;
	
	public get time():string {
		const d = new Date(parseInt(this.raffleData.tags['tmi-sent-ts'] as string));
		return Utils.toDigits(d.getHours())+":"+Utils.toDigits(d.getMinutes());
	}

	public copyJSON():void {
		Utils.copyToClipboard(JSON.stringify(this.raffleData));
		console.log(this.raffleData);
		gsap.fromTo(this.$el, {scale:1.2}, {duration:.5, scale:1, ease:"back.out(1.7)"});
	}
}
</script>

<style scoped lang="less">
.chatraffleresult{
	
	background-color: rgba(255, 255, 255, .15);
	border-radius: 5px;
	margin: 5px 0;
	padding: 5px !important;
	text-align: center;

	display: flex;
	flex-direction: row;
	align-items: center;
	color: #fff;

	&>.icon {
		width: 1.5em;
		height: 1.5em;
		object-fit: contain;
		margin-right: 1em;
	}
}
</style>