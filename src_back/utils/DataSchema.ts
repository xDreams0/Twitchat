import Ajv from "ajv";

/**
 * Data schema to make sure people don't send random or invalid data to the server
 */
 const UserDataSchema = {
	type:"object",
	additionalProperties: false,
	properties:{
		activityFeedFilters: {
			type:"object",
			additionalProperties: false,
			properties: {
				sub:{
					type:"boolean",
				},
				follow:{
					type:"boolean",
				},
				bits:{
					type:"boolean",
				},
				raid:{
					type:"boolean",
				},
				rewards:{
					type:"boolean",
				},
				poll:{
					type:"boolean",
				},
				prediction:{
					type:"boolean",
				},
				bingo:{
					type:"boolean",
				},
				raffle:{
					type:"boolean",
				}
			}
		},
		obsConnectionEnabled: {type:"boolean"},
		obsConf_muteUnmute: {
			type:"object",
			properties: {
				audioSourceName:{type:"string"},
				muteCommand:{type:"string"},
				unmuteCommand:{type:"string"},
			}
		},
		obsConf_permissions: {
			type:"object",
			additionalProperties: false,
			properties: {
				broadcaster: {type:"boolean"},
				mods: {type:"boolean"},
				vips: {type:"boolean"},
				subs: {type:"boolean"},
				all: {type:"boolean"},
				users: {type:"string", maxLength:1000},
			}
		},
		obsConf_scenes: {
			type:"array",
			items:[
				{
					type:"object",
					additionalProperties: false,
					properties:{
						scene: 
						{
							type:"object",
							additionalProperties: false,
							properties:{
								sceneIndex:{type:"integer"},
								sceneName:{type:"string", maxLength:100},
							}
						},
						command:{type:"string", maxLength:100},
					}
				}
			]
		},
		triggers: {
			type:["object"],
			additionalProperties: true,
			patternProperties: {
				".*": {
					type: "object",
					additionalProperties: false,
					properties: {
						enabled: {type:"boolean"},
						name: {type:"string", maxLength:100},
						chatCommand: {type:"string", maxLength:100},//Deprecated
						scheduleParams: {
							type:"object",
							properties: {
								type: {type:"string", maxLength:100},
								repeatDuration: {type:"number", minimum:0, maximum:48*60},
								repeatMinMessages: {type:"number", minimum:0, maximum:9999},
								dates:{
									type:"array",
									items: [
										{
											type: "object",
											additionalProperties: false,
											properties: {
												daily: {type:"boolean"},
												yearly: {type:"boolean"},
												value: {type:"string", maxLength:20},
											}
										}
									]
								}
							}
						},
						permissions: {
							type:"object",
							properties: {
								broadcaster: {type:"boolean"},
								mods: {type:"boolean"},
								vips: {type:"boolean"},
								subs: {type:"boolean"},
								all: {type:"boolean"},
								users: {type:"string", maxLength:1000},
							}
						},
						cooldown: {
							type:"object",
							properties: {
								global: {type:"number", minimum:0, maximum:60*60*12},
								user: {type:"number", minimum:0, maximum:60*60*12},
							}
						},
						actions:{
							type:"array",
							items: [
								{
									type: "object",
									additionalProperties: false,
									properties: {
										id: {type:"string", maxLength:100},
										sourceName: {type:"string", maxLength:100},
										show: {type:"boolean"},
										delay: {type:"number"},
										filterName: {type:"string", maxLength:100},
										text: {type:"string", maxLength:500},
										url: {type:"string", maxLength:1000},
										mediaPath: {type:"string", maxLength:1000},
										type: {type:"string", maxLength:50},
										musicAction: {type:"string", maxLength:3},
										track: {type:"string", maxLength:500},
										confirmMessage: {type:"string", maxLength:500},
										playlist: {type:"string", maxLength:500},
										voiceID: {type:"string", maxLength:100},
										triggerKey: {type:"string", maxLength:100},
										raffleData: {
											type: "object",
											additionalProperties: false,
											properties: {
												mode: {type:"string", maxLength:20},
												command: {type:"string", maxLength:100},
												duration: {type:"number", minimum:0, maximum:120},
												maxEntries: {type:"number", minimum:0, maximum:1000000},
												created_at: {type:"number", minimum:0, maximum:9999999999999},
												entries: {
													type:"array",
													items: [
														{
															type: "object",
															additionalProperties: false,
															properties: {
																id:{type:"string", maxLength:100},
																label:{type:"string", maxLength:200},
																score:{type:"number", minimum:0, maximum:100},
															}
														}
													]
												},
												followRatio: {type:"number", minimum:0, maximum:100},
												vipRatio: {type:"number", minimum:0, maximum:100},
												subRatio: {type:"number", minimum:0, maximum:100},
												subgitRatio: {type:"number", minimum:0, maximum:100},
												subMode_includeGifters: {type:"boolean"},
												subMode_excludeGifted: {type:"boolean"},
												showCountdownOverlay: {type:"boolean"},
												customEntries: {type:"string", maxLength:1000000},
											},
										},
										bingoData: {
											type: "object",
											additionalProperties: false,
											properties: {
												guessNumber: {type:"boolean"},
												guessEmote: {type:"boolean"},
												min: {type:"number", minimum:0, maximum:999999999},
												max: {type:"number", minimum:0, maximum:999999999},
											}
										}
									}
								},
							]
						}
					}
				},
			}
		},
		botMessages: {
			type:"object",
			additionalProperties: false,
			properties: {
				raffleStart: {
					type:"object",
					additionalProperties: false,
					properties: {
						enabled: {type:"boolean"},
						message: {type:"string", maxLength:500},
					}
				},
				raffleJoin: {
					type:"object",
					additionalProperties: false,
					properties: {
						enabled: {type:"boolean"},
						message: {type:"string", maxLength:500},
					}
				},
				raffle: {
					type:"object",
					additionalProperties: false,
					properties: {
						enabled: {type:"boolean"},
						message: {type:"string", maxLength:500},
					}
				},
				bingoStart: {
					type:"object",
					additionalProperties: false,
					properties: {
						enabled: {type:"boolean"},
						message: {type:"string", maxLength:500},
					}
				},
				bingo: {
					type:"object",
					additionalProperties: false,
					properties: {
						enabled: {type:"boolean"},
						message: {type:"string", maxLength:500},
					}
				},
				shoutout: {
					type:"object",
					additionalProperties: false,
					properties: {
						enabled: {type:"boolean"},
						message: {type:"string", maxLength:500},
					}
				},
				twitchatAd: {
					type:"object",
					additionalProperties: false,
					properties: {
						enabled: {type:"boolean"},
						message: {type:"string", maxLength:500},
					}
				},
			}
		},
		voiceActions: {
			type:"array",
			items: [
				{
					type: "object",
					additionalProperties: false,
					properties: {
						id: {type:"string", maxLength:100},
						sentences: {type:"string", maxLength:1000},
					}
				},
			]
		},
		voiceLang: {type:"string"},
		"streamInfoPresets":{
			type:"array",
			items:[
				{
					type:"object",
					additionalProperties: false,
					properties:{
						name:{type:"string", maxLength:50},
						id:{type:"string", maxLength:10},
						title:{type:"string", maxLength:200},
						categoryID:{type:"string", maxLength:10},
						tagIDs:{
							type:"array",
							items:[{type:"string", maxLength:100}],
						},
					}
				}
			]
		},
		"p:blockedCommands": {type:"string"},
		"p:bttvEmotes": {type:"boolean"},
		"p:ffzEmotes": {type:"boolean"},
		"p:sevenTVEmotes": {type:"boolean"},
		"p:censorDeletedMessages": {type:"boolean"},
		"p:censoreDeletedMessages": {type:"boolean"},
		"p:conversationsEnabled": {type:"boolean"},
		"p:defaultSize": {type:"integer", minimum:0, maximum:5},
		"p:displayTime": {type:"boolean"},
		"p:firstMessage": {type:"boolean"},
		"p:firstTimeMessage": {type:"boolean"},
		"p:groupIdenticalMessage": {type:"boolean"},
		"p:hideUsers": {type:"string"},
		"p:highlightMentions": {type:"boolean"},
		"p:highlightMods": {type:"boolean"},
		"p:highlightNonFollowers": {type:"boolean"},
		"p:highlightSubs": {type:"boolean"},
		"p:highlightVips": {type:"boolean"},
		"p:historySize": {type:"integer", minimum:50, maximum:500},
		"p:ignoreCommands": {type:"boolean"},
		"p:ignoreListCommands": {type:"boolean"},
		"p:keepDeletedMessages": {type:"boolean"},
		"p:keepHighlightMyMessages": {type:"boolean"},
		"p:lockAutoScroll": {type:"boolean"},
		"p:markAsRead": {type:"boolean"},
		"p:minimalistBadges": {type:"boolean"},
		"p:notifyJoinLeave": {type:"boolean"},
		"p:raidHighlightUser": {type:"boolean"},
		"p:raidStreamInfo": {type:"boolean"},
		"p:receiveWhispers": {type:"boolean"},
		"p:showWhispersOnChat": {type:"boolean"},
		"p:showBadges": {type:"boolean"},
		"p:showBots": {type:"boolean"},
		"p:showCheers": {type:"boolean"},
		"p:showEmotes": {type:"boolean"},
		"p:showFollow": {type:"boolean"},
		"p:showHypeTrain": {type:"boolean"},
		"p:showModTools": {type:"boolean"},
		"p:splitViewVertical": {type:"boolean"},
		"p:showNotifications": {type:"boolean"},
		"p:showRaids": {type:"boolean"},
		"p:showRewards": {type:"boolean"},
		"p:showRewardsInfos": {type:"boolean"},
		"p:showSelf": {type:"boolean"},
		"p:showSlashMe": {type:"boolean"},
		"p:showSubs": {type:"boolean"},
		"p:showUserPronouns": {type:"boolean"},
		"p:showViewersCount": {type:"boolean"},
		"p:splitView": {type:"boolean"},
		"p:splitViewSwitch": {type:"boolean"},
		"p:stopStreamOnRaid": {type:"boolean"},
		"p:userHistoryEnabled": {type:"boolean"},
		"p:translateNames": {type:"boolean"},
		"p:spoilersEnabled": {type:"boolean"},
		"p:alertMode": {type:"boolean"},
		v: {type:"integer"},
		obsIP: {type:"string"},
		obsPort: {type:"integer"},
		updateIndex: {type:"integer"},
		raffle_message: {type:"string"},
		raffle_messageEnabled: {type:"boolean"},
		bingo_message: {type:"string"},
		bingo_messageEnabled: {type:"boolean"},
		greetScrollDownAuto: {type:"boolean"},
		greetAutoDeleteAfter: {type:"integer", minimum:-1, maximum:3600},
		devmode: {type:"boolean"},
		greetHeight: {type:"number"},
		leftColSize: {type:"number"},
		adNextTS: {type:"number"},
		adWarned: {type:"boolean"},
		sponsorPublicPrompt: {type:"boolean"},
		cypherKey: {type:"string"},
		raffle_showCountdownOverlay: {type:"boolean"},
		donorLevel: {type:"number", minimum:-1, maximum:10},
		"p:emergencyButton": {type:"boolean"},//Keep it a little to avoid loosing data, remove it later
		ttsParams: {
			type:"object",
			additionalProperties: false,
			properties: {
				enabled: {type:"boolean"},
				volume: {type:"number", minimum:0, maximum:1},
				rate: {type:"number", minimum:0.1, maximum:10},
				pitch: {type:"number", minimum:0, maximum:2},
				maxLength: {type:"integer", minimum:0, maximum:500},
				maxDuration: {type:"integer", minimum:0, maximum:120},
				timeout: {type:"integer", minimum:0, maximum:300},
				inactivityPeriod: {type:"integer", minimum:0, maximum:60},
				voice: {type:"string", maxLength:500},
				removeURL: {type:"boolean"},
				replaceURL: {type:"string", maxLength:100},
				removeEmotes: {type:"boolean"},
				readMessages:{type:"boolean"},
				readMessagePatern: {type:"string", maxLength:300},
				readWhispers:{type:"boolean"},
				readWhispersPattern: {type:"string", maxLength:300},
				readNotices:{type:"boolean"},
				readNoticesPattern: {type:"string", maxLength:300},
				readRewards: {type:"boolean"},
				readRewardsPattern: {type:"string", maxLength:300},
				readSubs: {type:"boolean"},
				readSubsPattern:{type:"string", maxLength:300},
				readSubgifts: {type:"boolean"},
				readSubgiftsPattern:{type:"string", maxLength:300},
				readBits: {type:"boolean"},
				readBitsMinAmount: {type:"number", minimum:0, maximum:1000000},
				readBitsPattern:{type:"string", maxLength:300},
				readRaids: {type:"boolean"},
				readRaidsPattern:{type:"string", maxLength:300},
				readFollow: {type:"boolean"},
				readFollowPattern:{type:"string", maxLength:300},
				readPolls: {type:"boolean"},
				readPollsPattern:{type:"string", maxLength:300},
				readPredictions: {type:"boolean"},
				readPredictionsPattern:{type:"string", maxLength:300},
				readBingos: {type:"boolean"},
				readBingosPattern:{type:"string", maxLength:300},
				readRaffle: {type:"boolean"},
				readRafflePattern:{type:"string", maxLength:300},
				readUsers:{
					type:"array",
					items:[{type:"string", maxLength:50}],
				},
				ttsPerms:{
					type:"object",
					additionalProperties: false,
					properties: {
						broadcaster: {type:"boolean"},
						mods: {type:"boolean"},
						vips: {type:"boolean"},
						subs: {type:"boolean"},
						all: {type:"boolean"},
						users: {type:"string", maxLength:1000},
					}
				},
			}
		},
		emergencyParams: {
			type:"object",
			additionalProperties: false,
			properties: {
				enabled:{type:"boolean"},
				chatCmd:{type:"string", maxLength:100},
				chatCmdPerms:{
					type:"object",
					additionalProperties: false,
					properties: {
						broadcaster: {type:"boolean"},
						mods: {type:"boolean"},
						vips: {type:"boolean"},
						subs: {type:"boolean"},
						all: {type:"boolean"},
						users: {type:"string", maxLength:1000},
					}
				},
				slowMode:{type:"boolean"},
				emotesOnly:{type:"boolean"},
				subOnly:{type:"boolean"},
				followOnly:{type:"boolean"},
				noTriggers:{type:"boolean"},
				followOnlyDuration:{type:"number"},
				slowModeDuration:{type:"number"},
				toUsers:{type:"string"},
				obsScene:{type:"string"},
				obsSources:{
					type:"array",
					items:[{type:"string", maxLength:100}],
				},
				autoEnableOnFollowbot:{type:"boolean"},
			}
		},
		emergencyFollowers: {
			type:"object",
			additionalProperties: false,
			properties: {
				uid:{type:"string", maxLength:50},
				login:{type:"string", maxLength:50},
				date:{type:"number"},
				blocked:{type:"boolean"},
				unblocked:{type:"boolean"},
			}
		},
		spoilerParams: {
			type:"object",
			additionalProperties: false,
			properties: {
				permissions:{
					type:"object",
					additionalProperties: false,
					properties: {
						broadcaster: {type:"boolean"},
						mods: {type:"boolean"},
						vips: {type:"boolean"},
						subs: {type:"boolean"},
						all: {type:"boolean"},
						users: {type:"string", maxLength:1000},
					}
				},
			}
		},
		chatHighlightParams: {
			type:"object",
			additionalProperties: false,
			properties: {
				position:{type:"string", maxLength:2},
			}
		},
		
		chatAlertParams: {
			type:"object",
			additionalProperties: false,
			properties: {
				chatCmd:{type:"string", maxLength:100},
				message: {type:"boolean"},
				shake: {type:"boolean"},
				sound: {type:"boolean"},
				blink: {type:"boolean"},
				permissions:{
					type:"object",
					additionalProperties: false,
					properties: {
						broadcaster: {type:"boolean"},
						mods: {type:"boolean"},
						vips: {type:"boolean"},
						subs: {type:"boolean"},
						all: {type:"boolean"},
						users: {type:"string", maxLength:1000},
					}
				},
			}
		},
		
		musicPlayerParams: {
			type:"object",
			additionalProperties: false,
			properties: {
				noScroll: {type:"boolean"},
				autoHide: {type:"boolean"},
				erase: {type:"boolean"},
				showCover: {type:"boolean"},
				showArtist: {type:"boolean"},
				showTitle: {type:"boolean"},
				showProgressbar: {type:"boolean"},
				openFromLeft: {type:"boolean"},
				customInfoTemplate: {type:"string", maxLength:5000},
			}
		},

		voicemodParams: {
			type:"object",
			additionalProperties: false,
			properties: {
				enabled: {type:"boolean"},
				voiceIndicator: {type:"boolean"},
				commandToVoiceID:{
					type:"object",
					additionalProperties: true,
					patternProperties: {
						".*": {type:"string", maxLength:100},
					}
				},
				chatCmdPerms:{
					type:"object",
					additionalProperties: false,
					properties: {
						broadcaster: {type:"boolean"},
						mods: {type:"boolean"},
						vips: {type:"boolean"},
						subs: {type:"boolean"},
						all: {type:"boolean"},
						users: {type:"string", maxLength:1000},
					}
				},
			}
		},

		automodParams: {
			type:"object",
			additionalProperties: false,
			properties: {
				enabled: {type:"boolean"},
				banUserNames: {type:"boolean"},
				exludedUsers: {
					type:"object",
					additionalProperties: false,
					properties: {
						broadcaster: {type:"boolean"},
						mods: {type:"boolean"},
						vips: {type:"boolean"},
						subs: {type:"boolean"},
						all: {type:"boolean"},
						users: {type:"string", maxLength:1000},
					}
				},
				keywordsFilters:{
					type:"object",
					additionalProperties: false,
					properties: {
						id: {type:"string", maxLength:36},
						label: {type:"string", maxLength:100},
						regex: {type:"string", maxLength:5000},
						enabled: {type:"boolean"},
						serverSync: {type:"boolean"},
					}
				},
			}
		}
	}
}

const ajv = new Ajv({strictTuples: false, verbose:true, removeAdditional:true, discriminator:true });
export const schemaValidator = ajv.compile( UserDataSchema );