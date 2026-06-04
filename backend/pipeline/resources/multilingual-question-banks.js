/**
 * Multilingual Question Bank System
 * Provides translations for all question banks to support multiple languages
 * Eliminates need for LLM translation calls during assessment
 */

const { questionBankManager } = require('./question-banks');

/**
 * Language-specific question translations
 * Each language has its own set of translated questions
 */
const MULTILINGUAL_QUESTIONS = {
  // Hindi (hi) - Expanded translations
  hi: {
    adhd: {
      adhd_attention_01: 'कितनी बार {childName} को विवरणों पर ध्यान देने या स्कूल के काम या अन्य गतिविधियों में लापरवाह गलतियां करने में कठिनाई होती है?',
      adhd_attention_02: 'कितनी बार {childName} को कार्यों या खेल गतिविधियों में ध्यान बनाए रखने में परेशानी होती है?',
      adhd_attention_03: 'कितनी बार {childName} सीधे बात करने पर सुनने में नहीं लगता?',
      adhd_attention_04: 'कितनी बार {childName} बाहरी उत्तेजनाओं जैसे ध्वनियों या गतियों से आसानी से विचलित हो जाता है?',
      adhd_attention_05: 'कितनी बार {childName} को निर्देशों का पालन करने और कार्यों को पूरा करने में कठिनाई होती है?',
      adhd_attention_06: 'कितनी बार {childName} को कार्यों को व्यवस्थित करने में कठिनाई होती है?',
      adhd_attention_07: 'कितनी बार {childName} को लंबे समय तक मानसिक प्रयास की आवश्यकता वाले कार्यों में संलग्न होने में कठिनाई होती है?',
      adhd_attention_08: 'कितनी बार {childName} को अपनी चीजें खोने में कठिनाई होती है?',
      adhd_attention_09: 'कितनी बार {childName} को दैनिक गतिविधियों में भूलने की आदत होती है?',
      adhd_attention_10: 'कितनी बार {childName} को कार्यों को शुरू करने में कठिनाई होती है?',
      adhd_hyperactivity_01: 'कितनी बार {childName} हाथों या पैरों से फिडगेट करता है या सीट में हिलता-डुलता है?',
      adhd_hyperactivity_02: 'कितनी बार {childName} कक्षा या अन्य स्थितियों में सीट छोड़ देता है जहां बैठे रहने की उम्मीद होती है?',
      adhd_hyperactivity_03: 'कितनी बार {childName} ऐसी स्थितियों में दौड़ता या चढ़ता है जहां यह अनुपयुक्त है?',
      adhd_hyperactivity_04: 'कितनी बार {childName} को शांतिपूर्वक खेलने या अवकाश गतिविधियों में संलग्न होने में कठिनाई होती है?',
      adhd_hyperactivity_05: 'कितनी बार {childName} को "चलते-फिरते" या "चलते रहने" की आवश्यकता महसूस होती है?',
      adhd_hyperactivity_06: 'कितनी बार {childName} बहुत अधिक बात करता है?',
      adhd_hyperactivity_07: 'कितनी बार {childName} को अपनी बारी का इंतजार करने में कठिनाई होती है?',
      adhd_hyperactivity_08: 'कितनी बार {childName} दूसरों को बाधित करता है या उन पर घुसपैठ करता है?',
      adhd_hyperactivity_09: 'कितनी बार {childName} को शांत रहने में कठिनाई होती है?',
      adhd_hyperactivity_10: 'कितनी बार {childName} को अपनी ऊर्जा को नियंत्रित करने में कठिनाई होती है?',
      adhd_impulsivity_01: 'कितनी बार {childName} सवाल पूरा होने से पहले जवाब बोल देता है?',
      adhd_impulsivity_02: 'कितनी बार {childName} को अपनी बारी का इंतजार करने में कठिनाई होती है?',
      adhd_impulsivity_03: 'कितनी बार {childName} दूसरों को बाधित करता है या उन पर घुसपैठ करता है?',
      adhd_impulsivity_04: 'कितनी बार {childName} को अपने कार्यों के परिणामों के बारे में सोचने में कठिनाई होती है?',
      adhd_impulsivity_05: 'कितनी बार {childName} को जोखिम लेने से पहले रुकने में कठिनाई होती है?',
      adhd_impulsivity_06: 'कितनी बार {childName} को अपनी भावनाओं को नियंत्रित करने में कठिनाई होती है?',
      adhd_impulsivity_07: 'कितनी बार {childName} को अपने शब्दों को मापने में कठिनाई होती है?',
      adhd_impulsivity_08: 'कितनी बार {childName} को अपने कार्यों को योजनाबद्ध तरीके से करने में कठिनाई होती है?',
      adhd_executive_01: 'कितनी बार {childName} को कार्यों और गतिविधियों को व्यवस्थित करने में कठिनाई होती है?',
      adhd_executive_02: 'कितनी बार {childName} निरंतर मानसिक प्रयास की आवश्यकता वाले कार्यों में संलग्न होने से बचता है?',
      adhd_executive_03: 'कितनी बार {childName} को अपने समय का प्रबंधन करने में कठिनाई होती है?',
      adhd_executive_04: 'कितनी बार {childName} को अपने लक्ष्यों को याद रखने में कठिनाई होती है?',
      adhd_executive_05: 'कितनी बार {childName} को अपने कार्यों को प्राथमिकता देने में कठिनाई होती है?',
      adhd_executive_06: 'कितनी बार {childName} को अपने कार्यों को टुकड़ों में तोड़ने में कठिनाई होती है?',
      adhd_executive_07: 'कितनी बार {childName} को अपने कार्यों को पूरा करने में कठिनाई होती है?',
      adhd_executive_08: 'कितनी बार {childName} को अपने कार्यों की योजना बनाने में कठिनाई होती है?',
      adhd_emotional_01: 'कितनी बार {childName} को निराशा या गुस्से को प्रबंधित करने में कठिनाई होती है?',
      adhd_emotional_02: 'कितनी बार {childName} को स्थिति के लिए अत्यधिक लगने वाले तीव्र भावनात्मक विस्फोट होते हैं?',
      adhd_emotional_03: 'कितनी बार {childName} को अपनी भावनाओं को नियंत्रित करने में कठिनाई होती है?',
      adhd_emotional_04: 'कितनी बार {childName} को तनावपूर्ण स्थितियों में शांत रहने में कठिनाई होती है?',
      adhd_emotional_05: 'कितनी बार {childName} को अपनी भावनाओं को दूसरों के साथ साझा करने में कठिनाई होती है?',
      adhd_emotional_06: 'कितनी बार {childName} को अपनी भावनाओं को समझने में कठिनाई होती है?',
      adhd_academic_01: 'कितनी बार {childName} के ध्यान की समस्याएं स्कूल के काम को पूरा करने में हस्तक्षेप करती हैं?',
      adhd_academic_02: 'कितनी बार {childName} को अपने स्कूल के काम को व्यवस्थित करने में कठिनाई होती है?',
      adhd_academic_03: 'कितनी बार {childName} को अपने स्कूल के काम को समय पर पूरा करने में कठिनाई होती है?',
      adhd_academic_04: 'कितनी बार {childName} को अपने स्कूल के काम की गुणवत्ता बनाए रखने में कठिनाई होती है?',
      adhd_academic_05: 'कितनी बार {childName} को अपने स्कूल के काम में लगातार रहने में कठिनाई होती है?',
      adhd_academic_06: 'कितनी बार {childName} को अपने स्कूल के काम में विवरणों पर ध्यान देने में कठिनाई होती है?',
      adhd_peer_01: 'कितनी बार {childName} को शांतिपूर्वक खेलने या अवकाश गतिविधियों में संलग्न होने में कठिनाई होती है?',
      adhd_peer_02: 'कितनी बार {childName} को अपने साथियों के साथ सहयोगपूर्वक काम करने में कठिनाई होती है?',
      adhd_peer_03: 'कितनी बार {childName} को अपने साथियों के साथ बातचीत में रुचि बनाए रखने में कठिनाई होती है?',
      adhd_peer_04: 'कितनी बार {childName} को अपने साथियों के साथ दोस्ती बनाने में कठिनाई होती है?',
      adhd_peer_05: 'कितनी बार {childName} को अपने साथियों के साथ संघर्ष को हल करने में कठिनाई होती है?',
      adhd_peer_06: 'कितनी बार {childName} को अपने साथियों के साथ सामाजिक नियमों का पालन करने में कठिनाई होती है?',
      adhd_family_01: 'कितनी बार {childName} को परिवार के नियमों या दिनचर्याओं का पालन करने में कठिनाई होती है?',
      adhd_family_02: 'कितनी बार {childName} को परिवार के सदस्यों के साथ बातचीत में रुचि बनाए रखने में कठिनाई होती है?',
      adhd_family_03: 'कितनी बार {childName} को परिवार की गतिविधियों में भाग लेने में कठिनाई होती है?',
      adhd_family_04: 'कितनी बार {childName} को परिवार के सदस्यों के साथ सहयोग करने में कठिनाई होती है?',
      adhd_sleep_01: 'कितनी बार {childName} को रात में सोने में कठिनाई होती है?',
      adhd_sleep_02: 'कितनी बार {childName} को सोने की दिनचर्या का पालन करने में कठिनाई होती है?',
      adhd_sleep_03: 'कितनी बार {childName} को सोने के समय शांत रहने में कठिनाई होती है?',
      adhd_sleep_04: 'कितनी बार {childName} को सोने के समय अपने विचारों को नियंत्रित करने में कठिनाई होती है?',
      adhd_self_esteem_01: 'कितनी बार {childName} अपनी क्षमताओं के बारे में नकारात्मक भावनाएं व्यक्त करता है?',
      adhd_self_esteem_02: 'कितनी बार {childName} को अपनी उपलब्धियों पर गर्व महसूस करने में कठिनाई होती है?',
      adhd_self_esteem_03: 'कितनी बार {childName} को अपनी क्षमताओं पर विश्वास करने में कठिनाई होती है?',
      adhd_self_esteem_04: 'कितनी बार {childName} को अपनी तुलना दूसरों से करने में कठिनाई होती है?'
    },
    autism: {
      autism_social_01: 'कितनी बार {childName} परिवार के सदस्यों के साथ बातचीत के दौरान आंखों का संपर्क बनाता है?',
      autism_social_02: 'कितनी बार {childName} आपके नाम पुकारने पर प्रतिक्रिया करता है?',
      autism_social_03: 'कितनी बार {childName} शब्दों के साथ इशारों का उपयोग करता है जैसे इशारा करना या हाथ हिलाना?',
      autism_social_04: 'कितनी बार {childName} बातचीत या सामाजिक बातचीत शुरू करता है?',
      autism_joint_01: 'जब आप किसी दिलचस्प चीज की ओर इशारा करते हैं, तो क्या {childName} वहां देखता है जहां आप इशारा कर रहे हैं?',
      autism_joint_02: 'क्या {childName} एक उंगली से किसी दिलचस्प चीज को दिखाने के लिए इशारा करता है?',
      autism_pretend_01: 'क्या {childName} खाली कप से पीने या गुड़िया को खिलाने का नाटक करता है?',
      autism_pretend_02: 'क्या {childName} वस्तुओं के साथ नाटक करता है, जैसे केले को फोन के रूप में उपयोग करना?',
      autism_interest_01: 'क्या {childName} को अन्य बच्चों में रुचि है? क्या वह उन्हें देखता है या उनके पास जाने की कोशिश करता है?',
      autism_routine_01: 'कितनी बार {childName} दैनिक दिनचर्या या योजनाओं में अप्रत्याशित परिवर्तन होने पर परेशान हो जाता है?',
      autism_sensory_01: 'कितनी बार {childName} रोजमर्रा की ध्वनियों जैसे वैक्यूम क्लीनर या हैंड ड्रायर से परेशान लगता है?',
      autism_communication_01: 'कितनी बार {childName} शब्दों या वाक्यांशों को बार-बार एक ही तरीके से दोहराता है?'
    },
    dyslexia: {
      dyslexia_phonological_01: 'क्या {childName} को तुकबंदी के खेल पसंद हैं और क्या वह तुकबंदी वाले शब्दों की पहचान कर सकता है?',
      dyslexia_phonological_02: 'क्या {childName} "cat" या "sun" जैसे शब्दों में पहली ध्वनि की पहचान कर सकता है?',
      dyslexia_phonological_03: '{childName} ध्वनियों को एक साथ मिलाकर शब्द बनाने में कितनी अच्छी तरह कर सकता है?',
      dyslexia_letter_01: 'क्या {childName} वर्णमाला के अधिकांश अक्षरों को पहचान और नाम दे सकता है?',
      dyslexia_letter_02: 'क्या {childName} जानता है कि अधिकांश अक्षर क्या ध्वनियां बनाते हैं?',
      dyslexia_decoding_01: '{childName} तीन अक्षरों के सरल शब्दों को कितनी अच्छी तरह बोल सकता है?',
      dyslexia_fluency_01: '{childName} सरल वाक्यों को कितनी सहजता से जोर से पढ़ता है?',
      dyslexia_spelling_01: 'जब {childName} शब्दों को वर्तनी करने की कोशिश करता है, तो क्या अक्षर ध्वन्यात्मक रूप से समझ में आते हैं?',
      dyslexia_comprehension_01: 'क्या {childName} समझता है और याद रखता है कि वह क्या पढ़ता है?'
    },
    general: {
      general_motor_01: 'कितनी अच्छी तरह {childName} आयु-उपयुक्त स्व-देखभाल कार्यों को स्वतंत्र रूप से पूरा कर सकता है?',
      general_motor_02: 'कितनी अच्छी तरह {childName} निर्देशों का पालन करता है और सरल कार्यों को पूरा करता है?',
      general_motor_03: 'कितनी अच्छी तरह {childName} सटीक कार्यों के लिए हाथ और आंख की गतिविधियों को समन्वित कर सकता है?',
      general_motor_04: 'कितनी अच्छी तरह {childName} शारीरिक गतिविधियों के दौरान संतुलन बनाए रख सकता है?',
      general_motor_05: 'कितनी अच्छी तरह {childName} खेल या खेलों के दौरान अपने शरीर की गतिविधियों को नियंत्रित कर सकता है?',
      general_motor_06: 'कितनी अच्छी तरह {childName} लेखन उपकरणों (पेंसिल, क्रेयॉन) का उपयोग कर सकता है?',
      general_motor_07: 'कितनी अच्छी तरह {childName} साथियों के साथ शारीरिक गतिविधियों में भाग ले सकता है?',
      general_motor_08: 'कितनी अच्छी तरह {childName} कपड़े बटन लगाने या जूते बांधने जैसे महीन मोटर कार्यों को पूरा कर सकता है?',
      general_motor_09: 'कितनी अच्छी तरह {childName} गतिविधियों के लिए अपने शरीर के दोनों पक्षों को समन्वित कर सकता है?',
      general_motor_10: 'कितनी अच्छी तरह {childName} लयबद्ध गतिविधियां कर सकता है और बीट पैटर्न का पालन कर सकता है?',
      
      general_cognitive_01: 'कितनी अच्छी तरह {childName} नई जानकारी सीख सकता है और याद रख सकता है?',
      general_cognitive_02: 'कितनी अच्छी तरह {childName} समस्याओं को हल कर सकता है और नए तरीके खोज सकता है?',
      general_cognitive_03: 'कितनी अच्छी तरह {childName} अपने विचारों को व्यवस्थित कर सकता है और योजना बना सकता है?',
      general_cognitive_04: 'कितनी अच्छी तरह {childName} अमूर्त अवधारणाओं को समझ सकता है?',
      general_cognitive_05: 'कितनी अच्छी तरह {childName} अपने आसपास की दुनिया के बारे में जिज्ञासा दिखाता है?',
      general_cognitive_06: 'कितनी अच्छी तरह {childName} नई स्थितियों में अपने ज्ञान का उपयोग कर सकता है?',
      general_cognitive_07: 'कितनी अच्छी तरह {childName} अपने विचारों को स्पष्ट रूप से व्यक्त कर सकता है?',
      general_cognitive_08: 'कितनी अच्छी तरह {childName} अपने कार्यों पर ध्यान केंद्रित कर सकता है?',
      general_cognitive_09: 'कितनी अच्छी तरह {childName} बहु-चरणीय निर्देशों को समझ और पालन कर सकता है?',
      general_cognitive_10: 'कितनी अच्छी तरह {childName} तार्किक रूप से सोच सकता है और समस्याओं को कदम-दर-कदम हल कर सकता है?',
      
      general_social_01: 'कितनी अच्छी तरह {childName} दूसरों के साथ सहयोग कर सकता है?',
      general_social_02: 'कितनी अच्छी तरह {childName} अपनी भावनाओं को नियंत्रित कर सकता है?',
      general_social_03: 'कितनी अच्छी तरह {childName} दूसरों की भावनाओं को समझ सकता है?',
      general_social_04: 'कितनी अच्छी तरह {childName} सामाजिक नियमों का पालन कर सकता है?',
      general_social_05: 'कितनी अच्छी तरह {childName} नई स्थितियों में खुद को अनुकूलित कर सकता है?',
      general_social_06: 'कितनी अच्छी तरह {childName} दूसरों के साथ सहानुभूति दिखा सकता है?',
      general_social_07: 'कितनी अच्छी तरह {childName} अपने साथियों के साथ संघर्ष को हल कर सकता है?',
      general_social_08: 'कितनी अच्छी तरह {childName} दूसरों के साथ सकारात्मक संबंध बना सकता है?',
      general_social_09: 'कितनी अच्छी तरह {childName} दूसरों के व्यक्तिगत स्थान को समझ और सम्मान कर सकता है?',
      general_social_10: 'कितनी अच्छी तरह {childName} दूसरों की भावनाओं के प्रति सहानुभूति और समझ दिखा सकता है?',
      
      general_communication_01: 'कितनी अच्छी तरह {childName} अपने विचारों को स्पष्ट रूप से व्यक्त कर सकता है?',
      general_communication_02: 'कितनी अच्छी तरह {childName} दूसरों की बात सुन सकता है?',
      general_communication_03: 'कितनी अच्छी तरह {childName} उचित शब्दों का उपयोग कर सकता है?',
      general_communication_04: 'कितनी अच्छी तरह {childName} अपनी बात को तार्किक रूप से व्यवस्थित कर सकता है?',
      general_communication_05: 'कितनी अच्छी तरह {childName} गैर-मौखिक संकेतों को समझ सकता है?',
      general_communication_06: 'कितनी अच्छी तरह {childName} अपनी बात को विभिन्न तरीकों से व्यक्त कर सकता है?',
      general_communication_07: 'कितनी अच्छी तरह {childName} अपनी बात को संक्षिप्त और स्पष्ट रख सकता है?',
      general_communication_08: 'कितनी अच्छी तरह {childName} अपनी बात को दूसरों की समझ के अनुसार समायोजित कर सकता है?',
      general_communication_09: 'कितनी अच्छी तरह {childName} बोलते समय उचित स्वर और मात्रा का उपयोग कर सकता है?',
      general_communication_10: 'कितनी अच्छी तरह {childName} विभिन्न स्थितियों के लिए अपनी संचार शैली को अनुकूलित कर सकता है?',
      
      general_academic_01: 'कितनी अच्छी तरह {childName} अपने स्कूल के काम को पूरा कर सकता है?',
      general_academic_02: 'कितनी अच्छी तरह {childName} अपने स्कूल के काम को व्यवस्थित कर सकता है?',
      general_academic_03: 'कितनी अच्छी तरह {childName} अपने स्कूल के काम को समय पर पूरा कर सकता है?',
      general_academic_04: 'कितनी अच्छी तरह {childName} अपने स्कूल के काम की गुणवत्ता बनाए रख सकता है?',
      general_academic_05: 'कितनी अच्छी तरह {childName} अपने स्कूल के काम में लगातार रह सकता है?',
      general_academic_06: 'कितनी अच्छी तरह {childName} अपने स्कूल के काम में विवरणों पर ध्यान दे सकता है?',
      general_academic_07: 'कितनी अच्छी तरह {childName} अपने स्कूल के काम में सुधार कर सकता है?',
      general_academic_08: 'कितनी अच्छी तरह {childName} अपने स्कूल के काम में रुचि बनाए रख सकता है?',
      general_academic_09: 'कितनी अच्छी तरह {childName} कक्षा की गतिविधियों और पाठों के दौरान ध्यान केंद्रित कर सकता है?',
      general_academic_10: 'कितनी अच्छी तरह {childName} कक्षा की चर्चाओं और गतिविधियों में सक्रिय रूप से भाग ले सकता है?',
      
      general_selfcare_01: 'कितनी अच्छी तरह {childName} आयु-उपयुक्त स्व-देखभाल कार्यों को स्वतंत्र रूप से पूरा कर सकता है?',
      general_selfcare_02: 'कितनी अच्छी तरह {childName} अपनी दैनिक दिनचर्या का पालन कर सकता है?',
      general_selfcare_03: 'कितनी अच्छी तरह {childName} अपनी चीजों का प्रबंधन कर सकता है और उन पर नज़र रख सकता है?',
      general_selfcare_04: 'कितनी अच्छी तरह {childName} अपने लिए आयु-उपयुक्त निर्णय ले सकता है?',
      general_selfcare_05: 'कितनी अच्छी तरह {childName} अपनी दैनिक दिनचर्या और गतिविधियों को व्यवस्थित कर सकता है?',
      general_selfcare_06: 'कितनी अच्छी तरह {childName} अपने सीखने और होमवर्क के लिए जिम्मेदारी ले सकता है?',
      general_selfcare_07: 'कितनी अच्छी तरह {childName} अपना समय प्रबंधित कर सकता है और कार्यों को प्राथमिकता दे सकता है?',
      general_selfcare_08: 'कितनी अच्छी तरह {childName} लक्ष्य निर्धारित कर सकता है और उन्हें प्राप्त करने के लिए काम कर सकता है?',

      // New motor skills sub-domains
      general_gross_motor_01: 'कितनी अच्छी तरह {childName} खेल के मैदान के उपकरणों पर दौड़, कूद और चढ़ सकता है?',
      general_gross_motor_02: 'कितनी अच्छी तरह {childName} सटीकता के साथ गेंद फेंक और पकड़ सकता है?',
      general_gross_motor_03: 'कितनी अच्छी तरह {childName} साइकिल या तिपहिया साइकिल चला सकता है?',
      general_gross_motor_04: 'कितनी अच्छी तरह {childName} छोटी कूद, हॉप और लयबद्ध गतिविधियां कर सकता है?',

      // New fine motor skills
      general_fine_motor_01: 'कितनी अच्छी तरह {childName} रेखाओं के साथ काटने के लिए कैंची का उपयोग कर सकता है?',
      general_fine_motor_02: 'कितनी अच्छी तरह {childName} छोटे ब्लॉक्स या लेगो के साथ बना सकता है?',
      general_fine_motor_03: 'कितनी अच्छी तरह {childName} मोतियों को पिरो सकता है या थ्रेडिंग गतिविधियों को पूरा कर सकता है?',
      general_fine_motor_04: 'कितनी अच्छी तरह {childName} पहचानने योग्य आकार और आकृतियां बना सकता है?',

      // New cognitive development sub-domains
      general_memory_01: 'कितनी अच्छी तरह {childName} बहु-चरणीय निर्देशों को याद रख और पालन कर सकता है?',
      general_memory_02: 'कितनी अच्छी तरह {childName} दिन या सप्ताह के पहले के घटनाओं को याद कर सकता है?',
      general_memory_03: 'कितनी अच्छी तरह {childName} जिन लोगों से मिलता है उनके नाम याद रख सकता है?',
      general_memory_04: 'कितनी अच्छी तरह {childName} अपनी चीजें कहां रखी हैं याद रख सकता है?',

      // New problem-solving skills
      general_problem_solving_01: 'कितनी अच्छी तरह {childName} सरल पहेलियों या समस्याओं को हल करने का तरीका ढूंढ सकता है?',
      general_problem_solving_02: 'कितनी अच्छी तरह {childName} जब कुछ काम नहीं करता तो वैकल्पिक समाधान सोच सकता है?',
      general_problem_solving_03: 'कितनी अच्छी तरह {childName} सरल गतिविधियों या कार्यों के लिए आगे की योजना बना सकता है?',
      general_problem_solving_04: 'कितनी अच्छी तरह {childName} गलतियों से सीख सकता है और अलग-अलग दृष्टिकोण आजमा सकता है?',

      // New social skills sub-domains
      general_empathy_01: 'कितनी अच्छी तरह {childName} दूसरों की भावनाओं को पहचान और उन पर प्रतिक्रिया कर सकता है?',
      general_empathy_02: 'कितनी अच्छी तरह {childName} जब दूसरे परेशान होते हैं तो उन्हें सांत्वना दे सकता है?',
      general_empathy_03: 'कितनी अच्छी तरह {childName} दूसरों के साथ खिलौने या सामग्री साझा कर सकता है?',
      general_empathy_04: 'कितनी अच्छी तरह {childName} खेलों या गतिविधियों में अपनी बारी ले सकता है?',

      // New communication sub-domains
      general_listening_01: 'कितनी अच्छी तरह {childName} जब दूसरे बोल रहे होते हैं तो ध्यान से सुनता है?',
      general_listening_02: 'कितनी अच्छी तरह {childName} समूह सेटिंग्स में बातचीत का पालन कर सकता है?',
      general_listening_03: 'कितनी अच्छी तरह {childName} कहानियों या बातचीत से विवरण याद रख सकता है?',
      general_listening_04: 'कितनी अच्छी तरह {childName} सवालों या अनुरोधों पर उचित रूप से प्रतिक्रिया कर सकता है?',

      // New self-care sub-domains
      general_hygiene_01: 'कितनी अच्छी तरह {childName} व्यक्तिगत स्वच्छता बनाए रख सकता है (हाथ धोना, दांत ब्रश करना)?',
      general_hygiene_02: 'कितनी अच्छी तरह {childName} अलग-अलग मौसम के लिए उचित रूप से कपड़े पहन सकता है?',
      general_hygiene_03: 'कितनी अच्छी तरह {childName} अपनी व्यक्तिगत चीजों और स्थान को व्यवस्थित कर सकता है?',
      general_hygiene_04: 'कितनी अच्छी तरह {childName} गतिविधियों के बाद अपने आप को साफ कर सकता है?',

      // New emotional regulation sub-domains
      general_stress_management_01: 'कितनी अच्छी तरह {childName} जब परेशान या निराश महसूस करता है तो खुद को शांत कर सकता है?',
      general_stress_management_02: 'कितनी अच्छी तरह {childName} जब जरूरत हो तो सांस लेने या आराम की तकनीकों का उपयोग कर सकता है?',
      general_stress_management_03: 'कितनी अच्छी तरह {childName} जब अभिभूत महसूस करता है तो मदद मांग सकता है?',
      general_stress_management_04: 'कितनी अच्छी तरह {childName} उचित तरीकों से अपनी भावनाओं को व्यक्त कर सकता है?'
    }
  },

  // Spanish (es)
  es: {
    adhd: {
      adhd_attention_01: '¿Con qué frecuencia {childName} tiene dificultad para prestar atención a los detalles o comete errores por descuido en el trabajo escolar u otras actividades?',
      adhd_attention_02: '¿Con qué frecuencia {childName} tiene problemas para mantener la atención en tareas o actividades de juego?',
      adhd_hyperactivity_01: '¿Con qué frecuencia {childName} se mueve nerviosamente con las manos o pies o se retuerce en el asiento?',
      adhd_impulsivity_01: '¿Con qué frecuencia {childName} suelta respuestas antes de que se completen las preguntas?'
    },
    autism: {
      autism_social_01: '¿Con qué frecuencia {childName} hace contacto visual durante conversaciones con miembros de la familia?',
      autism_joint_01: 'Cuando señalas algo interesante, ¿{childName} mira hacia donde estás señalando?',
      autism_pretend_01: '¿{childName} finge beber de una taza vacía o alimentar a una muñeca?'
    },
    dyslexia: {
      dyslexia_phonological_01: '¿A {childName} le gustan los juegos de rimas y puede identificar palabras que riman?',
      dyslexia_letter_01: '¿Puede {childName} reconocer y nombrar la mayoría de las letras del alfabeto?'
    },
    general: {
      general_emotional_01: '¿Con qué frecuencia {childName} tiene dificultad para manejar emociones grandes o calmarse después de estar molesto?',
      general_peer_01: '¿Con qué frecuencia {childName} hace y mantiene amistades exitosamente con niños de su edad?'
    }
  },

  // French (fr)
  fr: {
    adhd: {
      adhd_attention_01: 'À quelle fréquence {childName} a-t-il des difficultés à prêter attention aux détails ou fait-il des erreurs d\'inattention dans les devoirs ou autres activités?',
      adhd_hyperactivity_01: 'À quelle fréquence {childName} gigote-t-il avec les mains ou les pieds ou se tortille-t-il sur son siège?'
    },
    autism: {
      autism_social_01: 'À quelle fréquence {childName} établit-il un contact visuel lors de conversations avec les membres de la famille?',
      autism_joint_01: 'Quand vous pointez quelque chose d\'intéressant, {childName} regarde-t-il où vous pointez?'
    },
    dyslexia: {
      dyslexia_phonological_01: '{childName} aime-t-il les jeux de rimes et peut-il identifier les mots qui riment?'
    },
    general: {
      general_emotional_01: 'À quelle fréquence {childName} a-t-il des difficultés à gérer de grandes émotions ou à se calmer après avoir été contrarié?'
    }
  },

  // German (de)
  de: {
    adhd: {
      adhd_attention_01: 'Wie oft hat {childName} Schwierigkeiten, auf Details zu achten oder macht nachlässige Fehler bei Schulaufgaben oder anderen Aktivitäten?',
      adhd_hyperactivity_01: 'Wie oft zappelt {childName} mit Händen oder Füßen oder rutscht auf dem Sitz herum?'
    },
    autism: {
      autism_social_01: 'Wie oft macht {childName} Augenkontakt während Gesprächen mit Familienmitgliedern?',
      autism_joint_01: 'Wenn Sie auf etwas Interessantes zeigen, schaut {childName} dann dorthin, wohin Sie zeigen?'
    },
    dyslexia: {
      dyslexia_phonological_01: 'Mag {childName} Reimspiele und kann er/sie Wörter identifizieren, die sich reimen?'
    },
    general: {
      general_emotional_01: 'Wie oft hat {childName} Schwierigkeiten, große Emotionen zu bewältigen oder sich nach einem Ärger zu beruhigen?'
    }
  },

  // Arabic (ar)
  ar: {
    adhd: {
      adhd_attention_01: 'كم مرة يواجه {childName} صعوبة في الانتباه للتفاصيل أو يرتكب أخطاء بسبب الإهمال في الواجبات المدرسية أو الأنشطة الأخرى؟',
      adhd_hyperactivity_01: 'كم مرة يتحرك {childName} بلا هدوء بيديه أو قدميه أو يتلوى في مقعده؟'
    },
    autism: {
      autism_social_01: 'كم مرة يحدث {childName} تواصل بصري أثناء المحادثات مع أفراد الأسرة؟',
      autism_joint_01: 'عندما تشير إلى شيء مثير للاهتمام، هل ينظر {childName} إلى حيث تشير؟'
    },
    dyslexia: {
      dyslexia_phonological_01: 'هل يستمتع {childName} بألعاب القافية وهل يمكنه تحديد الكلمات التي تتطابق في القافية؟'
    },
    general: {
      general_emotional_01: 'كم مرة يواجه {childName} صعوبة في إدارة المشاعر الكبيرة أو الهدوء بعد الشعور بالضيق؟'
    }
  },

  // Chinese (zh)
  zh: {
    adhd: {
      adhd_attention_01: '{childName} 多久一次在功课或其他活动中难以注意细节或犯粗心错误？',
      adhd_hyperactivity_01: '{childName} 多久一次用手或脚摆弄或坐在座位上扭动？'
    },
    autism: {
      autism_social_01: '{childName} 多久一次在与家庭成员交谈时进行眼神接触？',
      autism_joint_01: '当你指向有趣的东西时，{childName} 会看向你指向的地方吗？'
    },
    dyslexia: {
      dyslexia_phonological_01: '{childName} 喜欢押韵游戏并能识别押韵的单词吗？'
    },
    general: {
      general_emotional_01: '{childName} 多久一次难以管理大情绪或在心烦意乱后平静下来？'
    }
  },

  // Japanese (ja)
  ja: {
    adhd: {
      adhd_attention_01: '{childName}は、宿題やその他の活動で細部に注意を払ったり、不注意な間違いを犯したりすることにどのくらいの頻度で困難を感じていますか？',
      adhd_hyperactivity_01: '{childName}は、手や足をそわそわ動かしたり、座席で身をよじったりすることがどのくらいの頻度でありますか？'
    },
    autism: {
      autism_social_01: '{childName}は、家族との会話中にアイコンタクトをどのくらいの頻度で行いますか？',
      autism_joint_01: 'あなたが興味深いものを指さしたとき、{childName}はあなたが指しているところを見ますか？'
    },
    dyslexia: {
      dyslexia_phonological_01: '{childName}は韻を踏むゲームを楽しみ、韻を踏む単語を識別できますか？'
    },
    general: {
      general_emotional_01: '{childName}は大きな感情を管理したり、動揺した後に落ち着いたりすることにどのくらいの頻度で困難を感じていますか？'
    }
  },

  // Korean (ko)
  ko: {
    adhd: {
      adhd_attention_01: '{childName}는 숙제나 다른 활동에서 세부사항에 주의를 기울이거나 부주의한 실수를 하는 데 얼마나 자주 어려움을 겪나요?',
      adhd_hyperactivity_01: '{childName}는 손이나 발을 안절부절 못하거나 자리에 앉아서 꿈틀거리는 일이 얼마나 자주 있나요?'
    },
    autism: {
      autism_social_01: '{childName}는 가족 구성원과의 대화 중에 얼마나 자주 시선을 맞추나요?',
      autism_joint_01: '당신이 흥미로운 것을 가리킬 때, {childName}는 당신이 가리키는 곳을 보나요?'
    },
    dyslexia: {
      dyslexia_phonological_01: '{childName}는 운율 게임을 즐기고 운율이 맞는 단어를 식별할 수 있나요?'
    },
    general: {
      general_emotional_01: '{childName}는 큰 감정을 관리하거나 화가 난 후 진정하는 데 얼마나 자주 어려움을 겪나요?'
    }
  },

  // Portuguese (pt)
  pt: {
    adhd: {
      adhd_attention_01: 'Com que frequência {childName} tem dificuldade em prestar atenção aos detalhes ou comete erros por descuido no trabalho escolar ou outras atividades?',
      adhd_hyperactivity_01: 'Com que frequência {childName} se mexe nervosamente com as mãos ou pés ou se contorce no assento?'
    },
    autism: {
      autism_social_01: 'Com que frequência {childName} faz contato visual durante conversas com membros da família?',
      autism_joint_01: 'Quando você aponta para algo interessante, {childName} olha para onde você está apontando?'
    },
    dyslexia: {
      dyslexia_phonological_01: '{childName} gosta de jogos de rimas e consegue identificar palavras que rimam?'
    },
    general: {
      general_emotional_01: 'Com que frequência {childName} tem dificuldade em gerenciar grandes emoções ou se acalmar após ficar chateado?'
    }
  },

  // Russian (ru)
  ru: {
    adhd: {
      adhd_attention_01: 'Как часто {childName} испытывает трудности с вниманием к деталям или допускает небрежные ошибки в школьных заданиях или других видах деятельности?',
      adhd_hyperactivity_01: 'Как часто {childName} ерзает руками или ногами или извивается на сиденье?'
    },
    autism: {
      autism_social_01: 'Как часто {childName} устанавливает зрительный контакт во время разговоров с членами семьи?',
      autism_joint_01: 'Когда вы указываете на что-то интересное, смотрит ли {childName} туда, куда вы указываете?'
    },
    dyslexia: {
      dyslexia_phonological_01: 'Нравятся ли {childName} игры с рифмами и может ли он/она определять слова, которые рифмуются?'
    },
    general: {
      general_emotional_01: 'Как часто {childName} испытывает трудности с управлением сильными эмоциями или успокоением после расстройства?'
    }
  },

  // Italian (it)
  it: {
    adhd: {
      adhd_attention_01: 'Con quale frequenza {childName} ha difficoltà a prestare attenzione ai dettagli o commette errori di disattenzione nei compiti scolastici o altre attività?',
      adhd_hyperactivity_01: 'Con quale frequenza {childName} si agita con le mani o i piedi o si contorce sul sedile?'
    },
    autism: {
      autism_social_01: 'Con quale frequenza {childName} stabilisce un contatto visivo durante le conversazioni con i membri della famiglia?',
      autism_joint_01: 'Quando indichi qualcosa di interessante, {childName} guarda dove stai indicando?'
    },
    dyslexia: {
      dyslexia_phonological_01: 'A {childName} piacciono i giochi di rime e riesce a identificare parole che fanno rima?'
    },
    general: {
      general_emotional_01: 'Con quale frequenza {childName} ha difficoltà a gestire grandi emozioni o a calmarsi dopo essere stato turbato?'
    }
  }
};

/**
 * Multilingual Question Bank Manager
 * Extends the base question bank manager with language support
 */
class MultilingualQuestionBankManager extends questionBankManager.constructor {
  constructor() {
    super();
    this.multilingualQuestions = MULTILINGUAL_QUESTIONS;
    this.supportedLanguages = Object.keys(this.multilingualQuestions);
  }

  /**
   * Get question in specific language
   */
  getQuestionInLanguage(questionId, language, childName, childAge) {
    // Check if language is supported
    if (!this.supportedLanguages.includes(language)) {
      console.log(`⚠️ Language ${language} not supported, falling back to English`);
      return null;
    }

    // Get the base question template
    const baseQuestion = this.findQuestionById(questionId);
    if (!baseQuestion) {
      console.log(`⚠️ Question ${questionId} not found in base question bank`);
      return null;
    }

    // Get translated prompt
    const translatedPrompt = this.getTranslatedPrompt(questionId, language);
    if (!translatedPrompt) {
      console.log(`⚠️ Translation not available for question ${questionId} in ${language}`);
      return null;
    }

    // Create personalized question with translation
    return {
      id: `${questionId}_${Date.now()}`,
      prompt: translatedPrompt.replace(/{childName}/g, childName).replace(/{childAge}/g, childAge),
      question: translatedPrompt.replace(/{childName}/g, childName).replace(/{childAge}/g, childAge),
      domain: baseQuestion.domain,
      disorder: baseQuestion.disorder,
      type: baseQuestion.type,
      options: baseQuestion.options,
      optionLabels: this.getTranslatedOptionLabels(language, baseQuestion.type),
      difficulty: baseQuestion.difficulty,
      skill: baseQuestion.skill,
      screeningTool: baseQuestion.screeningTool,
      ageAppropriate: baseQuestion.isAgeAppropriate(childAge),
      language: language,
      timestamp: new Date().toISOString(),
      metadata: {
        ...baseQuestion.metadata,
        source: 'multilingual_question_bank',
        originalId: questionId,
        translated: true
      }
    };
  }

  /**
   * Find question by ID across all banks
   */
  findQuestionById(questionId) {
    for (const disorder of Object.keys(this.questionBanks)) {
      const question = this.questionBanks[disorder].find(q => q.id === questionId);
      if (question) return question;
    }
    return null;
  }

  /**
   * Get translated prompt for question
   */
  getTranslatedPrompt(questionId, language) {
    // Extract disorder from question ID
    const disorder = this.extractDisorderFromId(questionId);
    
    if (!disorder || !this.multilingualQuestions[language] || !this.multilingualQuestions[language][disorder]) {
      return null;
    }

    return this.multilingualQuestions[language][disorder][questionId] || null;
  }

  /**
   * Extract disorder from question ID
   */
  extractDisorderFromId(questionId) {
    if (questionId.startsWith('adhd_')) return 'adhd';
    if (questionId.startsWith('autism_')) return 'autism';
    if (questionId.startsWith('dyslexia_')) return 'dyslexia';
    if (questionId.startsWith('general_')) return 'general';
    return null;
  }

  /**
   * Get translated option labels for question type
   */
  getTranslatedOptionLabels(language, questionType) {
    const optionLabels = {
      SCALE: {
        en: ["Never", "Rarely", "Sometimes", "Often", "Very Often"],
        hi: ["कभी नहीं", "शायद ही कभी", "कभी-कभी", "अक्सर", "बहुत अक्सर"],
        es: ["Nunca", "Raramente", "A veces", "A menudo", "Muy a menudo"],
        fr: ["Jamais", "Rarement", "Parfois", "Souvent", "Très souvent"],
        de: ["Nie", "Selten", "Manchmal", "Oft", "Sehr oft"],
        ar: ["أبداً", "نادراً", "أحياناً", "غالباً", "كثيراً جداً"],
        zh: ["从不", "很少", "有时", "经常", "总是"],
        ja: ["決して", "めったに", "時々", "しばしば", "非常にしばしば"],
        ko: ["전혀", "거의", "가끔", "자주", "매우 자주"],
        pt: ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Muito frequentemente"],
        ru: ["Никогда", "Редко", "Иногда", "Часто", "Очень часто"],
        it: ["Mai", "Raramente", "A volte", "Spesso", "Molto spesso"]
      },
      MCQ: {
        en: ["Yes", "No", "Sometimes", "Not sure"],
        hi: ["हाँ", "नहीं", "कभी-कभी", "यकीन नहीं"],
        es: ["Sí", "No", "A veces", "No estoy seguro"],
        fr: ["Oui", "Non", "Parfois", "Je ne suis pas sûr"],
        de: ["Ja", "Nein", "Manchmal", "Nicht sicher"],
        ar: ["نعم", "لا", "أحياناً", "لست متأكداً"],
        zh: ["是", "否", "有时", "不确定"],
        ja: ["はい", "いいえ", "時々", "わからない"],
        ko: ["예", "아니오", "가끔", "모르겠음"],
        pt: ["Sim", "Não", "Às vezes", "Não tenho certeza"],
        ru: ["Да", "Нет", "Иногда", "Не уверен"],
        it: ["Sì", "No", "A volte", "Non sono sicuro"]
      }
    };

    return optionLabels[questionType]?.[language] || optionLabels[questionType]?.en || optionLabels.SCALE.en;
  }

  /**
   * Select next question in specific language
   */
  selectNextQuestionInLanguage(sessionId, assessmentType, childAge, usedDomains, childName, language = 'en') {
    // If language is supported and has translations, use multilingual approach
    if (this.supportedLanguages.includes(language) && language !== 'en') {
      return this.selectMultilingualQuestion(sessionId, assessmentType, childAge, usedDomains, childName, language);
    }

    // Fall back to base implementation for English or unsupported languages
    return super.selectNextQuestion(sessionId, assessmentType, childAge, usedDomains, childName, language);
  }

  /**
   * Select multilingual question
   */
  selectMultilingualQuestion(sessionId, assessmentType, childAge, usedDomains, childName, language) {
    const availableQuestions = this.getAvailableQuestions(assessmentType, childAge, usedDomains);
    const usedIds = this.usedQuestionIds.get(sessionId) || new Set();

    const unusedQuestions = availableQuestions.filter(q => !usedIds.has(q.id));

    if (unusedQuestions.length === 0) {
      // Check if we've used all available questions for this assessment type
      const totalQuestions = this.questionBanks[assessmentType.toLowerCase()] || this.questionBanks.general;
      const ageAppropriateQuestions = totalQuestions.filter(q => q.isAgeAppropriate(childAge));
      
      if (usedIds.size >= ageAppropriateQuestions.length) {
        // All questions have been used, end the assessment
        console.log(`🏁 All ${ageAppropriateQuestions.length} multilingual questions have been used for session ${sessionId}. Assessment complete.`);
        return null;
      }
      
      // If no unused questions available but we haven't used all questions,
      // reset tracking and try again with different domain selection
      console.log(`🔄 No unused questions available for multilingual session ${sessionId}, resetting tracking`);
      this.usedQuestions.delete(sessionId);
      this.usedQuestionIds.delete(sessionId);
      
      // Try to select from different domains to avoid immediate repetition
      const alternativeDomains = this.getSmartDomainRotation(assessmentType, childAge, usedDomains, sessionId);
      if (alternativeDomains.length > 0) {
        return this.selectMultilingualQuestion(sessionId, assessmentType, childAge, alternativeDomains, childName, language);
      }
      
      return this.selectMultilingualQuestion(sessionId, assessmentType, childAge, [], childName, language);
    }

    const selectedQuestion = this.selectOptimalQuestion(unusedQuestions, usedDomains, childAge);

    const translatedQuestion = this.getQuestionInLanguage(
      selectedQuestion.id,
      language,
      childName,
      childAge
    );

    if (!translatedQuestion) {
      console.log(`⚠️ Falling back to English for question ${selectedQuestion.id}`);
      return super.selectNextQuestion(sessionId, assessmentType, childAge, usedDomains, childName, 'en');
    }

    if (!this.usedQuestions.has(sessionId)) {
      this.usedQuestions.set(sessionId, new Set());
    }
    if (!this.usedQuestionIds.has(sessionId)) {
      this.usedQuestionIds.set(sessionId, new Set());
    }

    this.usedQuestions.get(sessionId).add(selectedQuestion.domain);
    this.usedQuestionIds.get(sessionId).add(selectedQuestion.id);

    console.log(`✅ Selected multilingual question ${selectedQuestion.id} from domain ${selectedQuestion.domain} for session ${sessionId} in ${language}`);

    return translatedQuestion;
  }

  /**
   * Get alternative domains to avoid immediate repetition
   */
  getAlternativeDomains(assessmentType, childAge, usedDomains) {
    const bank = this.questionBanks[assessmentType.toLowerCase()] || this.questionBanks.general;
    const allDomains = [...new Set(bank.map(q => q.domain))];
    const availableDomains = allDomains.filter(domain => !usedDomains.includes(domain));
    
    // Return more domains to ensure better diversity
    // For General assessment, return up to 6 domains to prevent cycling too quickly
    const maxDomains = assessmentType.toLowerCase() === 'general' ? 6 : 4;
    return availableDomains.slice(0, Math.min(maxDomains, availableDomains.length));
  }

  /**
   * Get smart domain rotation to maximize diversity
   */
  getSmartDomainRotation(assessmentType, childAge, usedDomains, sessionId) {
    const bank = this.questionBanks[assessmentType.toLowerCase()] || this.questionBanks.general;
    const allDomains = [...new Set(bank.map(q => q.domain))];
    
    // If this is a reset scenario, prioritize domains that haven't been used recently
    if (usedDomains.length === 0) {
      // For General assessment, start with a diverse set of domains
      if (assessmentType.toLowerCase() === 'general') {
        const priorityDomains = [
          'motor_skills', 'cognitive_development', 'social_skills', 
          'academic_performance', 'selfcare_independence', 'emotional_regulation'
        ];
        return priorityDomains.filter(domain => allDomains.includes(domain));
      }
      return allDomains.slice(0, Math.min(4, allDomains.length));
    }
    
    // If we have used domains, prioritize unused ones
    const unusedDomains = allDomains.filter(domain => !usedDomains.includes(domain));
    
    // For General assessment, ensure we don't cycle back to recently used domains
    if (assessmentType.toLowerCase() === 'general' && unusedDomains.length > 0) {
      // Return more unused domains to prevent quick cycling
      return unusedDomains.slice(0, Math.min(6, unusedDomains.length));
    }
    
    return unusedDomains.slice(0, Math.min(4, unusedDomains.length));
  }

  /**
   * Get language support information
   */
  getLanguageSupport() {
    return {
      supported: this.supportedLanguages,
      total: this.supportedLanguages.length,
      coverage: this.getTranslationCoverage()
    };
  }

  /**
   * Get translation coverage statistics
   */
  getTranslationCoverage() {
    const coverage = {};
    
    this.supportedLanguages.forEach(lang => {
      const langData = this.multilingualQuestions[lang];
      let totalQuestions = 0;
      let translatedQuestions = 0;
      
      Object.keys(langData).forEach(disorder => {
        totalQuestions += Object.keys(this.questionBanks[disorder] || []).length;
        translatedQuestions += Object.keys(langData[disorder] || {}).length;
      });
      
      coverage[lang] = {
        total: totalQuestions,
        translated: translatedQuestions,
        percentage: Math.round((translatedQuestions / totalQuestions) * 100)
      };
    });
    
    return coverage;
  }
}

// Create multilingual manager instance
const multilingualQuestionBankManager = new MultilingualQuestionBankManager();

module.exports = {
  MultilingualQuestionBankManager,
  multilingualQuestionBankManager,
  MULTILINGUAL_QUESTIONS
};
