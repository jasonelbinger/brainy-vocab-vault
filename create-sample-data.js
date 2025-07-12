// Script to create sample vocabulary cards for testing
// Run this with: node create-sample-data.js

const sampleCards = [
  {
    word: "resilient",
    partOfSpeech: "adjective",
    customFields: {
      definition: "Able to recover quickly from difficulties; tough and flexible",
      characteristics: "Bounces back from setbacks\nAdapts to change well\nMaintains positive attitude\nLearns from failure",
      examples: "A resilient person who overcame job loss\nResilient plants that survive drought\nA resilient community after disaster",
      synonyms: "Tough, flexible, adaptable, hardy, strong, durable"
    }
  },
  {
    word: "ephemeral",
    partOfSpeech: "adjective", 
    customFields: {
      definition: "Lasting for a very short time; temporary",
      characteristics: "Brief duration\nQuickly fading\nMomentary existence\nShort-lived beauty",
      examples: "Ephemeral flowers that bloom for one day\nThe ephemeral nature of childhood\nEphemeral internet trends",
      synonyms: "Temporary, fleeting, brief, transient, momentary, short-lived"
    }
  },
  {
    word: "ubiquitous",
    partOfSpeech: "adjective",
    customFields: {
      definition: "Present, appearing, or found everywhere",
      characteristics: "Exists everywhere\nCommonly seen\nWidespread presence\nHard to avoid",
      examples: "Smartphones are ubiquitous in modern society\nUbiquitous security cameras in the city\nThe ubiquitous presence of social media",
      synonyms: "Everywhere, widespread, common, universal, omnipresent, pervasive"
    }
  },
  {
    word: "meticulous",
    partOfSpeech: "adjective",
    customFields: {
      definition: "Showing great attention to detail; very careful and precise",
      characteristics: "Extremely careful\nPays attention to details\nThorough in work\nPrecise and accurate",
      examples: "A meticulous scientist recording data\nMeticulous planning for the wedding\nShe was meticulous about her appearance",
      synonyms: "Careful, precise, thorough, detailed, exact, scrupulous"
    }
  },
  {
    word: "ambiguous",
    partOfSpeech: "adjective",
    customFields: {
      definition: "Having more than one possible meaning; unclear or vague",
      characteristics: "Multiple meanings\nUnclear intent\nOpen to interpretation\nLacks precision",
      examples: "An ambiguous statement from the politician\nAmbiguous instructions that confused students\nThe ending of the movie was ambiguous",
      synonyms: "Unclear, vague, confusing, uncertain, indefinite, equivocal"
    }
  },
  {
    word: "catalyst",
    partOfSpeech: "noun",
    customFields: {
      definition: "A person or thing that causes or accelerates change or action",
      characteristics: "Triggers change\nSpeeds up processes\nCauses reactions\nInfluences outcomes",
      examples: "The protest was a catalyst for reform\nA catalyst that speeds chemical reactions\nHer speech was the catalyst for action",
      synonyms: "Trigger, spark, stimulus, agent, cause, motivator"
    }
  },
  {
    word: "pragmatic",
    partOfSpeech: "adjective",
    customFields: {
      definition: "Dealing with things practically rather than idealistically",
      characteristics: "Practical approach\nFocuses on results\nRealistic thinking\nAction-oriented",
      examples: "A pragmatic solution to the problem\nPragmatic voters who focus on issues\nHis pragmatic approach to business",
      synonyms: "Practical, realistic, sensible, down-to-earth, logical, reasonable"
    }
  },
  {
    word: "eloquent",
    partOfSpeech: "adjective",
    customFields: {
      definition: "Fluent and persuasive in speaking or writing",
      characteristics: "Speaks beautifully\nPersuasive communication\nClear expression\nMoving words",
      examples: "An eloquent speech that moved the audience\nThe eloquent lawyer convinced the jury\nHer eloquent writing style",
      synonyms: "Articulate, fluent, persuasive, expressive, well-spoken, graceful"
    }
  },
  {
    word: "innovative",
    partOfSpeech: "adjective",
    customFields: {
      definition: "Introducing new ideas; original and creative in thinking",
      characteristics: "Creates new ideas\nThinks outside the box\nOriginal approach\nForward-thinking",
      examples: "An innovative app design\nInnovative teaching methods\nThe company's innovative solutions",
      synonyms: "Creative, original, inventive, groundbreaking, novel, pioneering"
    }
  },
  {
    word: "tenacious",
    partOfSpeech: "adjective",
    customFields: {
      definition: "Holding firmly to something; persistent and determined",
      characteristics: "Never gives up\nPersistent effort\nStrong determination\nHolds on tightly",
      examples: "A tenacious athlete who trained daily\nTenacious in pursuing her goals\nThe tenacious reporter uncovered the truth",
      synonyms: "Persistent, determined, stubborn, resolute, steadfast, unwavering"
    }
  },
  {
    word: "versatile",
    partOfSpeech: "adjective",
    customFields: {
      definition: "Able to adapt or be adapted to many different functions or activities",
      characteristics: "Multi-talented\nAdaptable to situations\nFlexible abilities\nMany uses",
      examples: "A versatile actor who plays many roles\nVersatile tools for different jobs\nShe's versatile in sports and academics",
      synonyms: "Flexible, adaptable, multi-skilled, all-around, diverse, capable"
    }
  },
  {
    word: "gregarious",
    partOfSpeech: "adjective",
    customFields: {
      definition: "Fond of the company of others; sociable",
      characteristics: "Enjoys social gatherings\nLikes being around people\nOutgoing personality\nFriendly nature",
      examples: "A gregarious person who loves parties\nGregarious animals that live in groups\nHis gregarious personality made him popular",
      synonyms: "Sociable, outgoing, friendly, social, extroverted, companionable"
    }
  },
  {
    word: "skeptical",
    partOfSpeech: "adjective",
    customFields: {
      definition: "Having doubts or reservations; not easily convinced",
      characteristics: "Questions claims\nDoubtful attitude\nSeeks evidence\nCritical thinking",
      examples: "Skeptical about the new treatment\nA skeptical scientist demanding proof\nSkeptical of online reviews",
      synonyms: "Doubtful, questioning, suspicious, wary, cynical, distrustful"
    }
  },
  {
    word: "frivolous",
    partOfSpeech: "adjective",
    customFields: {
      definition: "Not having any serious purpose or value; trivial",
      characteristics: "Lacks seriousness\nTrivial importance\nPlayful nature\nNot meaningful",
      examples: "A frivolous lawsuit with no merit\nFrivolous spending on unnecessary items\nFrivolous conversation about celebrities",
      synonyms: "Trivial, silly, unimportant, superficial, petty, meaningless"
    }
  },
  {
    word: "profound",
    partOfSpeech: "adjective",
    customFields: {
      definition: "Very great or intense; having deep meaning or significance",
      characteristics: "Deep meaning\nGreat intensity\nSignificant impact\nThought-provoking",
      examples: "A profound philosophical question\nProfound grief after the loss\nThe book had a profound effect on readers",
      synonyms: "Deep, intense, significant, meaningful, important, substantial"
    }
  },
  {
    word: "indifferent",
    partOfSpeech: "adjective",
    customFields: {
      definition: "Having no particular interest or sympathy; unconcerned",
      characteristics: "Shows no interest\nLacks concern\nUncaring attitude\nNeutral feelings",
      examples: "Indifferent to the outcome of the game\nAn indifferent response to criticism\nIndifferent about fashion trends",
      synonyms: "Unconcerned, apathetic, uninterested, neutral, detached, aloof"
    }
  },
  {
    word: "spontaneous",
    partOfSpeech: "adjective",
    customFields: {
      definition: "Done without planning; natural and unforced",
      characteristics: "Unplanned actions\nNatural response\nImmediate reaction\nInstinctive behavior",
      examples: "A spontaneous decision to travel\nSpontaneous applause from the audience\nHer spontaneous laughter was contagious",
      synonyms: "Unplanned, impulsive, natural, instinctive, automatic, impromptu"
    }
  },
  {
    word: "comprehensive",
    partOfSpeech: "adjective",
    customFields: {
      definition: "Including or dealing with all or nearly all elements or aspects",
      characteristics: "Covers everything\nAll-inclusive approach\nDetailed coverage\nNothing left out",
      examples: "A comprehensive study of climate change\nComprehensive insurance coverage\nComprehensive exam covering all topics",
      synonyms: "Complete, thorough, extensive, all-inclusive, detailed, exhaustive"
    }
  },
  {
    word: "deliberate",
    partOfSpeech: "adjective",
    customFields: {
      definition: "Done consciously and intentionally; careful and unhurried",
      characteristics: "Intentional action\nCareful planning\nThoughtful approach\nPurposeful behavior",
      examples: "A deliberate attempt to mislead\nDeliberate movements of the dancer\nDeliberate choice of words",
      synonyms: "Intentional, purposeful, calculated, planned, conscious, methodical"
    }
  },
  {
    word: "substantial",
    partOfSpeech: "adjective",
    customFields: {
      definition: "Of considerable importance, size, or worth; significant",
      characteristics: "Large in size\nImportant value\nSignificant amount\nConsiderable impact",
      examples: "A substantial donation to charity\nSubstantial evidence of wrongdoing\nSubstantial improvements in performance",
      synonyms: "Significant, considerable, large, important, major, sizeable"
    }
  },
  {
    word: "arbitrary",
    partOfSpeech: "adjective",
    customFields: {
      definition: "Based on random choice rather than reason or system",
      characteristics: "Random decisions\nNo logical basis\nUnpredictable choices\nLacks reasoning",
      examples: "An arbitrary rule with no explanation\nArbitrary deadlines that change daily\nArbitrary punishment for minor mistakes",
      synonyms: "Random, unreasonable, capricious, unpredictable, irrational, whimsical"
    }
  },
  {
    word: "efficient",
    partOfSpeech: "adjective",
    customFields: {
      definition: "Working in a well-organized way; achieving maximum productivity",
      characteristics: "Well-organized\nMaximum output\nMinimal waste\nEffective methods",
      examples: "An efficient worker who completes tasks quickly\nEfficient use of resources\nEfficient transportation system",
      synonyms: "Productive, effective, organized, streamlined, optimal, economical"
    }
  },
  {
    word: "abstract",
    partOfSpeech: "adjective",
    customFields: {
      definition: "Existing in thought or as an idea but not having physical existence",
      characteristics: "Not physical\nConceptual ideas\nTheoretical nature\nMental concepts",
      examples: "Abstract concepts like love and justice\nAbstract art with no realistic forms\nAbstract mathematical theories",
      synonyms: "Theoretical, conceptual, intangible, non-physical, ideational, philosophical"
    }
  },
  {
    word: "dynamic",
    partOfSpeech: "adjective",
    customFields: {
      definition: "Characterized by constant change, activity, or progress",
      characteristics: "Constantly changing\nFull of energy\nActive movement\nProgressive nature",
      examples: "A dynamic leader who inspires change\nThe dynamic economy grows rapidly\nDynamic weather patterns",
      synonyms: "Energetic, active, changing, vigorous, lively, progressive"
    }
  },
  {
    word: "authentic",
    partOfSpeech: "adjective",
    customFields: {
      definition: "Genuine and original; not false or copied",
      characteristics: "Real and genuine\nOriginal source\nNot fake\nTruthful nature",
      examples: "An authentic antique from the 1800s\nAuthentic Italian cuisine\nAuthentic emotions, not pretend",
      synonyms: "Genuine, real, original, legitimate, true, valid"
    }
  }
];

console.log(`Ready to create ${sampleCards.length} sample cards`);
console.log('Please authenticate first and then use the card creation UI to add these manually, or I can add them directly to the database storage.');