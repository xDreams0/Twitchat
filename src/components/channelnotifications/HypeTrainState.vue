<template>
	<div :class="classes" :style="styles">
		
		<div class="content" v-if="trainData.state == 'APPROACHING'">
			<img src="@/assets/icons/train.svg" alt="train" class="icon" v-if="!boostMode">
			<img src="@/assets/icons/boost.svg" alt="boost" class="icon" v-if="boostMode">
			<h1>{{label}} train Approaching!</h1>
		</div>
		
		<div class="content" v-if="trainData.state == 'COMPLETED'">
			<img src="@/assets/icons/train.svg" alt="train" class="icon" v-if="!boostMode">
			<img src="@/assets/icons/boost.svg" alt="boost" class="icon" v-if="boostMode">
			<h1>
				{{label}} train complete<br />
				<span class="subtitle">Level <strong>{{completeLevel}}</strong> reached</span>
			</h1>
		</div>
		
		<div class="content" v-if="trainData.state == 'EXPIRE'">
			<img src="@/assets/icons/train.svg" alt="train" class="icon" v-if="!boostMode">
			<img src="@/assets/icons/boost.svg" alt="boost" class="icon" v-if="boostMode">
			<h1>{{label}} train went away...</h1>
		</div>
		
		<div class="content" v-if="trainProgress">
			<img src="@/assets/icons/train.svg" alt="train" class="icon" v-if="!boostMode">
			<img src="@/assets/icons/boost.svg" alt="boost" class="icon" v-if="boostMode">
			<h1>{{label}} train level {{trainData.level}}</h1>
			<p class="percent">{{roundProgressPercent}}%</p>
		</div>

		<ProgressBar v-if="(trainProgress || trainData.state == 'APPROACHING') && trainData.state != 'COMPLETED'"
			class="progressBar"
			:duration="timerDuration"
			:percent="timerPercent"
			:green="boostMode"
		/>
	</div>
</template>

<script lang="ts">
import type { HypeTrainStateData } from '@/types/TwitchatDataTypes';
import StoreProxy from '@/utils/StoreProxy';
import Utils from '@/utils/Utils';
import { watch } from '@vue/runtime-core';
import gsap from 'gsap';
import type { StyleValue } from 'vue';
import { Options, Vue } from 'vue-class-component';
import ProgressBar from '../ProgressBar.vue';

@Options({
	props:{},
	components:{
		ProgressBar,
	}
})
export default class HypeTrainState extends Vue {

	// state:"APPROACHING" | "START" | "PROGRESSING" | "LEVEL_UP" | "COMPLETED" | "EXPIRE";

	public timerPercent = 0;
	public timerDuration = 0;
	public progressPercent = 0;
	public disposed = false;

	public get boostMode():boolean {
		return this.trainData.is_boost_train;
	}

	public get label():string {
		return this.boostMode? "Boost" : "Hype";
	}

	public get completeLevel():number {
		let level = this.trainData.level;
		if(this.progressPercent < 100) level --;
		return level;
	}

	public get trainProgress():boolean {
		return this.trainData.state == 'START' || this.trainData.state == 'PROGRESSING' || this.trainData.state == 'LEVEL_UP';
	}

	public get trainData():HypeTrainStateData {
		return StoreProxy.store.state.hypeTrain as HypeTrainStateData;
	}

	public get duration():string {
		return Utils.formatDuration(this.trainData.timeLeft * (1-this.timerPercent) * 1000);
	}

	public get roundProgressPercent():number {
		return Math.round(this.progressPercent);
	}

	public get styles():StyleValue {
		if(this.trainProgress) {
			return {
				backgroundSize: `${this.progressPercent}% 100%`,
			}
		}
		return {};
	}

	public get classes():string[] {
		const res = ["hypetrainstate"];
		if(this.boostMode) res.push("boost");
		return res;
	}

	public mounted():void {
		this.dataChange();
		watch(()=>StoreProxy.store.state.hypeTrain, ()=>this.dataChange());

		this.renderFrame();
	}

	public beforeUnmount():void {
		this.disposed = true;
	}

	public dataChange():void {
		gsap.killTweensOf(this);

		this.timerDuration = this.trainData.state == "APPROACHING"? this.trainData.timeLeft * 1000 : 5*60*1000

		const p = Math.round(this.trainData.currentValue/this.trainData.goal * 100);
		gsap.to(this, {progressPercent:p, ease:"sine.inOut", duration:.5});
	}

	private renderFrame():void {
		if(this.disposed) return;
		requestAnimationFrame(()=>this.renderFrame());
		const ellapsed = new Date().getTime() - this.trainData.updated_at;
		const duration = this.trainData.timeLeft * 1000;
		this.timerPercent = 1 - (duration-ellapsed)/this.timerDuration;
	}

}
</script>

<style scoped lang="less">
.hypetrainstate{

	&.boost {
		@c: darken(#00f0f0, 15%);
		background-color: @c !important;
	}

	.progressBar {
		margin: 10px 0;
		color: @windowStateColor;
	}

	.content {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		flex-wrap: wrap;
		color: @mainColor_light;

		h1 {
			text-align: center;
			.subtitle {
				font-size: .9em;
				font-weight: normal;
			}
		}
		
		.icon {
			height: 25px;
			margin-right: 10px;
		}

		.duration {
			// font-size: .8em;
			margin-left: 15px;
		}

		.percent {
			font-family: "Azeret";
			font-size: 1.25em;
			margin-left: 15px;
			background-color: fade(@mainColor_light, 25%);
			padding: 5px;
			border-radius: 5px;
		}
	}
	
}
</style>