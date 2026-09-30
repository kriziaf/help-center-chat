/**
 * "Ask about conditions" flow — real content sourced from MD Live's blog, parsed into
 * short snippets per condition (skills/chat-repo-condition/SKILL.md). Presents every
 * condition's snippets as a flat, always-available chip picker (not a curated 3-chip
 * script like the Women's Health example in smartFlow.ts), since this is reference
 * content rather than a hand-authored demo. Always terminates by pointing to the
 * original blog article as the source of truth (currently a placeholder — no per-
 * condition blog URLs exist yet in the source data).
 */
import type { SmartNode, SmartChip } from "./smartFlow";

interface RawSnippet {
  title: string;
  /** Answer text. Omitted for a "group" snippet that only contains subSnippets (e.g. Cough Types). */
  text?: string;
  /** One extra picker level, e.g. Cough Types' 11 type entries, or Headache's two groups. */
  subSnippets?: RawSnippet[];
}

interface RawCondition {
  key: string;
  label: string;
  snippets: RawSnippet[];
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const RAW_CONDITIONS: RawCondition[] = [
  {
    key: "back-pain",
    label: "Back Pain",
    snippets: [
      { title: "Morning Routine", text: "Start your day with stretches. Keep bags light and switch sides often to prevent back strain." },
      { title: "Sitting", text: "Use lumbar support when sitting. Stand up and stretch every 45 minutes to prevent stiffness." },
      { title: "Exercising", text: "Exercise with proper form and engage your core. Increase intensity gradually to avoid back injury." },
      { title: "Diet", text: "Eat calcium & vitamin D-rich foods for bone health. Avoid inflammatory foods that worsen pain." },
      { title: "Sleeping", text: "Sleep on your back with a pillow under knees, or on your side with pillow between knees. Avoid stomach sleeping." },
      { title: "Home Remedies", text: "For quick relief: OTC pain meds, ice first 2-3 days then heat. Stay active with low-impact exercise." },
      { title: "When to See Doctor", text: "See a doctor for persistent pain, numbness, weakness, or fever. MDLIVE offers board-certified doctors in minutes." },
    ],
  },
  {
    key: "sleep-disorders",
    label: "Sleep Disorders",
    snippets: [
      { title: "Bedtime Ritual", text: "Create a bedtime ritual: calming music, relaxation techniques. Turn off screens 2 hours before bed." },
      { title: "Golden Hour of Sleep", text: "Aim to fall asleep between 10–10:59 PM daily. Consistency improves heart health, especially for women." },
      { title: "Get Checked Out", text: "If you're chronically sleepy, see a doctor. Stress and mental health issues can disrupt sleep — help is available." },
      { title: "Do More During the Day", text: "Get sunlight and exercise earlier in the day. Limit naps to 20 minutes in the early afternoon." },
      { title: "Key Stat", text: "Did you know? 35% of adults don't get enough sleep. Quality rest boosts memory, focus, immune system & weight." },
    ],
  },
  {
    key: "joint-pain-nutrition",
    label: "Joint Pain / Nutrition",
    snippets: [
      { title: "Avoid — Refined Grains", text: "Avoid refined grains (white bread, pasta, rice) — they spike inflammation. Choose whole wheat, oats, brown rice." },
      { title: "Avoid — Fried Foods", text: "Skip fried foods — high heat increases trans fat and inflammation. Opt for baked or steamed options." },
      { title: "Avoid — Sugary Drinks", text: "Cut sugary drinks — they increase inflammation. Switch to unsweetened or naturally sweetened beverages." },
      { title: "Avoid — Red/Processed Meat", text: "Limit red and processed meat to 3x per week. Choose fish, chicken, turkey, or tofu to reduce inflammation." },
      { title: "Avoid — Processed Snacks", text: "Replace processed snacks with dark chocolate, roasted chickpeas, or yogurt with berries." },
      { title: "Avoid — Alcohol", text: "Limit alcohol — it promotes inflammation. Max 1 drink/day for women, 2 for men." },
      { title: "Eat — Olive Oil", text: "Use olive oil for cooking — it's rich in antioxidants and fights inflammation." },
      { title: "Eat — Leafy Greens", text: "Add spinach, kale, and collards to your diet — they're packed with anti-inflammatory vitamins." },
      { title: "Eat — Nuts", text: "Snack on almonds and walnuts — their healthy fats and antioxidants reduce inflammation." },
      { title: "Eat — Fatty Fish", text: "Eat salmon, tuna, or mackerel 2x per week — omega-3s are powerful inflammation fighters." },
      { title: "Eat — Fruits", text: "Eat berries and citrus fruits — their antioxidants reduce inflammation and support overall health." },
      { title: "Key Fact", text: "Joint stiffness could signal a thyroid issue. Hypothyroidism causes inflammation that worsens joint pain." },
    ],
  },
  {
    key: "fatigue-tiredness",
    label: "Fatigue / Tiredness",
    snippets: [
      { title: "Tiredness vs Fatigue", text: "Tiredness is temporary and fixed by rest. Fatigue is persistent exhaustion that doesn't improve with sleep — it may signal a deeper health issue." },
      { title: "Causes of Daytime Sleepiness", text: "Daytime sleepiness? Check your habits: irregular sleep, screen time before bed, stress, and low iron can all be causes." },
      { title: "Sleep Disorder Signs", text: "Chronic snoring, waking unrefreshed, or falling asleep during the day? These could signal sleep apnea — talk to a doctor." },
      { title: "Fatigue & Chronic Conditions", text: "Fatigue can be linked to diabetes, heart disease, thyroid issues, or depression. Persistent exhaustion deserves medical attention." },
      { title: "How to Tell the Difference", text: "Simple test: does rest fix it? If yes, you're tired. If you're still drained after good sleep and it affects daily life, it could be fatigue." },
      { title: "7 Tips for Waking Refreshed", text: "Sleep better: keep a consistent schedule, limit caffeine after noon, make your room dark and cool, exercise regularly, and avoid screens before bed." },
      { title: "Key Stats", text: "1 in 3 Americans feel tired even after good sleep. 58% say it impacts their quality of life. Most haven't talked to a doctor about it." },
      { title: "When to See Doctor", text: "If fatigue interferes with your daily life or persists after rest, see an MDLIVE doctor to find the root cause." },
    ],
  },
  {
    key: "cough-respiratory",
    label: "Cough / Respiratory",
    snippets: [
      { title: "What is a cough?", text: "A cough is your body's way of clearing irritants. Common causes include infections, allergies, acid reflux, and environmental irritants." },
      { title: "Duration matters", text: "How long you've been coughing matters more than how it sounds. Under 3 weeks is acute; over 8 weeks may signal asthma or allergies." },
      { title: "Loud ≠ serious", text: "A loud cough isn't always serious. Your doctor evaluates the full picture — sound, duration, and other symptoms together." },
      { title: "No cough ≠ fine", text: "No cough doesn't mean you're well. Strep throat, mono, and other illnesses often don't cause coughing at all." },
      { title: "How to Alleviate", text: "For cough relief: stay hydrated, try honey and hot tea, use cough drops, take steamy showers. Consult a doctor before OTC meds." },
      { title: "Nighttime Cough", text: "Cough worse at night? Mucus buildup when lying down and active immune response overnight can increase coughing. Reflux may also contribute." },
      { title: "COVID-19 & Cough", text: "A cough could be COVID, flu, RSV, or a cold — get tested to find out. Stay up to date on vaccinations." },
      { title: "ER Warning Signs", text: "Seek emergency care immediately for: difficulty breathing, chest pain, confusion, or bluish lips/face with a cough." },
      {
        title: "Cough Types",
        subSnippets: [
          { title: "Dry — Allergies", text: "A dry cough with itchy eyes and sneezing? Likely allergies — no fever or chest congestion expected." },
          { title: "Dry — Flu", text: "Sudden dry cough with body aches, fever, and chills? Could be the flu — symptoms come on fast." },
          { title: "Dry — COVID", text: "Dry, unproductive cough with fever and fatigue? Get tested — it could be COVID-19." },
          { title: "Wet — Cold", text: "Wet cough with runny nose and sneezing? Likely a common cold — rest and fluids usually help." },
          { title: "Wet — Pneumonia", text: "Wet cough with fever, shortness of breath, and chest pain? Could be pneumonia — see a doctor right away." },
          { title: "Wet — RSV", text: "Wet, wheezy cough in a child with fever and poor appetite? Could be RSV — monitor closely and seek care for severe symptoms." },
          { title: "Whooping Cough", text: "Severe coughing fits with a \"whoop\" sound? Could be pertussis (whooping cough) — seek medical attention, especially for infants." },
          { title: "Barking/Croup", text: "Barking cough that sounds like a seal in a young child? Likely croup — most cases are mild, but monitor breathing closely." },
          { title: "Chronic — Asthma", text: "Persistent dry cough triggered by allergens or exercise? Could be asthma — talk to a doctor." },
          { title: "Chronic — GERD", text: "Chronic cough with heartburn or chest tightness? Acid reflux (GERD) could be the cause." },
          { title: "Chronic — COPD", text: "Long-lasting productive cough with shortness of breath and wheezing? Could be COPD — see a doctor for evaluation." },
        ],
      },
    ],
  },
  {
    key: "allergies",
    label: "Allergies",
    snippets: [
      { title: "Causes (Seasonal)", text: "Seasonal allergies are triggered by pollen from trees and grasses. Your immune system releases histamines causing sneezing, runny nose, and itchy eyes. Check pollen forecasts and reduce outdoor time on high-count days." },
      { title: "Causes (Perennial)", text: "Perennial allergies last year-round and are caused by dust mites, pet dander, mold, or insect dust. Both types trigger allergic rhinitis (allergy symptoms)." },
      { title: "Common Symptoms", text: "Common allergy symptoms include: itchy/watery eyes, scratchy throat, sneezing, rashes/hives, nasal congestion, and wheezing. See a doctor to confirm if it's allergies vs another condition." },
      { title: "Allergy vs Cold vs COVID", text: "It can be hard to tell allergies from a cold or COVID since symptoms overlap. If your symptoms return at the same time each year, it's likely seasonal allergies. New or worsening symptoms warrant a doctor visit." },
      { title: "Know Your Triggers", text: "Common allergy triggers include pollen, dust mites, mold, and animal dander. Keep a journal noting when symptoms start, duration, and possible triggers to help your doctor diagnose and treat." },
      { title: "Uncommon Allergies", text: "Unusual allergies include: leather/shoe chemicals, nickel in coins, stress-triggered histamines, laundry detergent chemicals, and sulfites in wine. Your body can view anything as a foreign invader." },
      { title: "Treatments (Medical)", text: "Allergy treatments include OTC antihistamines, nasal sprays, decongestants, and prescriptions. An MDLIVE doctor can help determine the best treatment for you from home." },
      { title: "Treatments (Home Tips)", text: "Home allergy relief tips: shower at night, use saline nasal rinses, take Vitamin C, stay hydrated, exercise, avoid dairy/gluten, eat spicy foods/ginger/herbal tea, and try local raw honey." },
      { title: "MDLIVE Perspective", text: "MDLIVE doctors recommend: 1) Check pollen forecasts and pre-medicate, 2) Stay indoors on dry/windy high-pollen days, 3) Keep windows closed and use air filters. Medication may still be needed despite best efforts." },
    ],
  },
  {
    key: "headache",
    label: "Headache",
    snippets: [
      {
        title: "Headache Types",
        subSnippets: [
          { title: "Tension Headache", text: "Tension headaches are the most common type, caused by stress and anxiety. They are primary headaches — not triggered by other health issues." },
          { title: "Migraine Headache", text: "Migraine headaches are primary headaches caused by genetics, hormones, and stress. They can be hereditary and often require medical treatment." },
          { title: "Cluster Headache", text: "Cluster headaches are primary headaches with unknown cause. They occur in severe, recurring episodes and should be evaluated by a doctor." },
          { title: "Sinus Headache", text: "Sinus headaches are secondary headaches caused by sinus infections, colds, or allergies. Treating the underlying condition helps resolve the headache." },
          { title: "Caffeine Headache", text: "Caffeine headaches can result from too much caffeine or caffeine withdrawal. Moderate your intake and don't skip your regular caffeine if dependent." },
          { title: "Hormonal Headache", text: "Hormonal headaches are caused by drops in estrogen before menstruation. They are secondary headaches linked to hormonal changes." },
          { title: "COVID Headache", text: "COVID headaches present as whole-head pressure and are often one of the first COVID symptoms. If accompanied by other COVID symptoms, get tested." },
        ],
      },
      {
        title: "General Info, Symptoms & Treatments",
        subSnippets: [
          { title: "What Causes Headaches", text: "Headaches are pain in the head/face from nerves or blood vessels — not the brain itself. Common triggers include alcohol, sleep changes, dehydration, stress, muscle strain, and weather changes." },
          { title: "Surprising Causes", text: "Surprising headache triggers: processed meats with nitrates, strong perfumes, tight ponytails/hats, slouching posture, and dehydration which shrinks the brain from the skull." },
          { title: "Common Symptoms", text: "Headache symptoms include throbbing or sharp pain, neck/shoulder pain, eye sensitivity, nausea, and upset stomach. Symptoms vary by type — some hurt on both sides, others focus on one area." },
          { title: "Treatments (Medical)", text: "Headache medications include prescription options, acetaminophen, ibuprofen, aspirin, and naproxen sodium. A doctor can determine the best treatment based on your headache type." },
          { title: "Treatments (Home)", text: "At-home headache relief: apply hot/cold compress, rest in a cool dark room, try meditation or relaxation exercises, get a massage, or have a small amount of caffeine." },
          { title: "Prevention (Lifestyle)", text: "Prevent headaches by: drinking plenty of water, exercising 30 min daily, sleeping at least 7 hours, and never skipping meals — especially breakfast." },
          { title: "Stress & Headaches", text: "Stress is the leading cause of headaches. If stress is a factor, consider talking to an MDLIVE therapist — appointments available within a week for stress management support." },
        ],
      },
    ],
  },
  {
    key: "cold-sore",
    label: "Cold Sore",
    snippets: [
      { title: "Causes", text: "Cold sores are caused by the herpes simplex virus (HSV-1/HSV-2), affecting 67% of the world's population under 50. The virus spreads through close contact or sharing utensils/towels." },
      { title: "Triggers", text: "Cold sore triggers include: cold/windy weather, sun exposure, cracked lips, hormonal changes, illness, weak immunity, food allergies, acidic foods, and stress. The virus reactivates from dormancy." },
      { title: "Stages", text: "Cold sores progress through 3 stages: 1) Tingling/itching/burning, 2) Pus-filled blisters form, 3) Crusting and scabbing. Most heal on their own." },
      { title: "Common Symptoms", text: "Cold sore symptoms include mouth sores plus (especially in first outbreaks): fever, headache, painful gums, muscle aches, sore throat, and swollen lymph nodes. Recurrences are usually milder." },
      { title: "What NOT To Do", text: "With cold sores: DON'T touch, pop, scrub, or pick at them. DON'T touch your eyes. Avoid acidic foods and sharing utensils/cups. Cold sores are highly contagious." },
      { title: "Treatments (Rx)", text: "Prescription cold sore treatments come in pill, cream, or ointment form and reduce healing time. An MDLIVE doctor can prescribe remotely." },
      { title: "Treatments (OTC)", text: "OTC cold sore remedies: antiviral ointments with alcohol, pain relievers, lidocaine/benzocaine creams, and lip balm with zinc oxide for protection." },
      { title: "Home Remedies", text: "Home cold sore remedies: diluted apple cider vinegar, essential oils (peppermint/clove/tea tree), lemon balm, cold cloth, warm compress, and styptic pencils." },
      { title: "When to See a Doctor", text: "See a doctor for cold sores that cause severe pain, recur often, irritate your eyes, spread to other body parts, or don't heal within 2 weeks. There is no cure for HSV — it stays permanently." },
    ],
  },
  {
    key: "covid-19",
    label: "COVID-19",
    snippets: [
      { title: "Common Symptoms", text: "COVID-19 symptoms (appear 2-14 days after exposure): breathing difficulties, headache, congestion, loss of taste/smell, cough, body aches, diarrhea, nausea, fatigue, sore throat, and fever/chills." },
      { title: "High-Risk Groups", text: "People with heart disease, lung disease, or diabetes face higher risk of severe COVID symptoms. Monitor symptoms closely and seek medical attention if they worsen." },
      { title: "Variants & Vaccines", text: "COVID variants can be more or less dangerous than the original. Vaccines don't prevent infection but protect against severe illness and hospitalization. Follow CDC vaccination recommendations." },
      { title: "Treatments (Medical)", text: "COVID treatments: Paxlovid (prescription antiviral for 18+), acetaminophen/NSAIDs for fever, nasal decongestants, throat lozenges, and cough drops. MDLIVE doctors can prescribe Paxlovid remotely." },
      { title: "At-Home Care", text: "For mild/moderate COVID at home: drink 64+ oz water daily, rest, sip hot tea with honey & lemon, eat bland foods like soup and crackers. Most people recover fine at home." },
      { title: "Prevention (CDC)", text: "Prevent COVID: get vaccinated, avoid contact with infected people, social distance, avoid poor ventilation, wash hands frequently, cover coughs, avoid face-touching, disinfect surfaces." },
      { title: "MDLIVE Help", text: "MDLIVE doctors (available in ~15 min) can: help determine cold vs flu vs COVID, answer questions, discuss testing/isolation, prescribe Paxlovid, and provide relief prescriptions. They cannot order COVID tests." },
      { title: "MDLIVE Perspective", text: "If you have COVID symptoms after exposure, talk to a doctor. For severe symptoms — especially difficulty breathing — seek in-person emergency medical attention immediately." },
    ],
  },
  {
    key: "cold-flu",
    label: "Cold & Flu",
    snippets: [
      { title: "Cold (Upper Respiratory Infection)", text: "Common cold symptoms come on gradually: runny/stuffy nose, sore throat, sneezing, mild cough. Usually resolves in 7-10 days. Fever is rare. If symptoms worsen or last 10+ days, see a doctor." },
      { title: "Flu (Influenza)", text: "Flu symptoms hit suddenly and are more severe than a cold: high fever, severe body aches, extreme fatigue, dry cough, chills. Get your annual flu shot. Complications can include pneumonia." },
      { title: "COVID-19 Comparison", text: "COVID-19 symptoms overlap with cold/flu but loss of taste/smell is more distinctive. Ranges from no symptoms to severe. If you suspect COVID, talk to an MDLIVE doctor to determine next steps." },
      { title: "MDLIVE Doctor Help", text: "MDLIVE offers faster diagnosis from home — 24/7/365 by phone or video. Board-certified doctors (avg 15 yrs experience) can diagnose and treat cold, flu, and COVID symptoms. No waiting rooms needed." },
      { title: "Doctor Tips (Prevention)", text: "Doctor tips for cold/flu season: Get your flu shot annually and follow CDC COVID guidelines. Exercise 30 minutes, 3 times per week to boost your immune system and energy." },
      { title: "Flu Tracking & Vaccines", text: "Track flu and COVID: Check CDC weekly reports for your state, use the CDC COVID Data Tracker for local data, and find flu vaccine locations near you." },
      { title: "COVID-19 Resource Center", text: "MDLIVE's COVID-19 resource center compiles guidance from doctors, CDC, and WHO. Covers symptom relief, isolation management, return-to-work guidance, and COVID treatment options." },
      { title: "When to See a Doctor", text: "See an MDLIVE doctor anytime — 24/7 alternative to urgent care, ERs, and doctor's offices. They treat 80+ common conditions from cold and flu to allergies and more, all from home." },
    ],
  },
  {
    key: "sore-throat",
    label: "Sore Throat",
    snippets: [
      { title: "Introduction", text: "A sore throat is a common condition that causes a dry, scratchy, or painful feeling. It accounts for 2-4% of yearly doctor visits. If symptoms are mild, try rest and home remedies. See a doctor if symptoms are severe or persistent." },
      { title: "Causes", text: "Sore throats are usually caused by viruses or bacteria (strep). Viral sore throats resolve in a few days. Strep throat requires antibiotics. Other causes include COVID-19, flu, allergies, GERD, and environmental irritants." },
      { title: "Common Symptoms — Sore Throat", text: "Common sore throat symptoms include pain when swallowing, dry or scratchy throat, cough, runny nose, and hoarseness." },
      { title: "Common Symptoms — Strep Throat", text: "Strep throat symptoms include pain when swallowing, fever, tiny red spots on the roof of the mouth, and red/swollen tonsils. A throat culture swab is needed for accurate diagnosis." },
      { title: "When to See a Doctor", text: "See a doctor if your sore throat is severe/persistent, you have difficulty breathing or swallowing, swollen tonsils with white patches, enlarged lymph nodes, high fever, rash, or nausea. Getting help quickly can ease symptoms." },
      { title: "OTC Treatments", text: "Over-the-counter treatments for sore throat include pain relievers, cough/cold medicines (ages 4+), lozenges, throat-numbing sprays, and eucalyptus oil." },
      { title: "Home Remedies", text: "Home remedies for sore throat: gargle with warm salt water, drink tea with honey, stay hydrated with clear liquids and warm broth, and try ice chips or popsicles for relief." },
      { title: "Foods to Avoid", text: "Avoid crackers, spicy foods, alcohol, coffee, vinegar, orange juice, dry snacks, raw vegetables, and acidic/carbonated drinks when you have a sore throat — they can irritate and worsen symptoms." },
      { title: "Prevention", text: "To help prevent sore throats, stay hydrated, get plenty of rest, and keep your immune system strong. Most sore throats result from viral infections like colds or flu." },
    ],
  },
  {
    key: "pink-eye",
    label: "Pink Eye (Conjunctivitis)",
    snippets: [
      { title: "Causes", text: "Pink eye (conjunctivitis) is caused by viruses, bacteria, chemicals/irritants, or allergies. It inflames the transparent membrane lining your eyelid, causing redness. Rarely serious but can be highly contagious." },
      { title: "Common Symptoms", text: "Pink eye symptoms include redness, gritty/scratchy feeling, watery or teary eyes, blurred vision, light sensitivity, itching/burning, swollen eyelids, and thick discharge that crusts overnight." },
      { title: "Pink Eye vs Allergies", text: "To tell pink eye from allergies: viral pink eye is more watery, bacterial causes thick discharge and eyes sticking together, allergies cause intense itching and watering. See a doctor for proper diagnosis." },
      { title: "Contagious? — Viruses", text: "Viral pink eye is the most common type and highly contagious. It spreads through sneezing, coughing, or contact. Can be contagious for up to two weeks while symptoms are present." },
      { title: "Contagious? — Bacteria", text: "Bacterial pink eye spreads through touching eyes with unwashed hands or contaminated objects like makeup or contact lenses. Less common than viral but highly contagious." },
      { title: "Contagious? — Chemical/Irritant", text: "Chemical/irritant pink eye is caused by foreign objects, chlorine, air pollution, or chemical splashes. It is NOT contagious." },
      { title: "Contagious? — Allergies", text: "Allergic conjunctivitis is caused by pollen, cosmetics, pet dander, or dust. It is NOT an infection and NOT contagious unless a secondary infection develops." },
      { title: "Treatment — Viral", text: "Viral pink eye treatment includes antiviral eye drops, steroids, cold/warm compresses, or artificial tears. Antibiotics do NOT work for this type." },
      { title: "Treatment — Bacterial", text: "Bacterial pink eye is treated with antibiotic eye drops, ointments, or pills prescribed by your doctor." },
      { title: "Treatment — Chemical", text: "For chemical pink eye, wash the affected eye with water for at least 5 minutes. If the irritant is chlorine or bleach, see a doctor immediately." },
      { title: "Treatment — Allergies", text: "Allergic pink eye can resolve once the allergen is removed or allergy is treated with antihistamines. Your doctor may prescribe lubricating or antihistamine eye drops." },
      { title: "Prevention Tips", text: "To prevent pink eye: wash hands often, avoid touching eyes, use clean washcloths, don't share cosmetics, change pillowcases regularly, and remove contact lenses if infected. Discard contaminated makeup." },
    ],
  },
  {
    key: "uti",
    label: "UTI (Urinary Tract Infection)",
    snippets: [
      { title: "Introduction", text: "UTIs are the second most common infection in the body, causing 8+ million healthcare visits yearly. They cause increased urge to urinate with burning sensation. One of the most common conditions MDLIVE treats." },
      { title: "Causes", text: "UTIs occur when bacteria enter the urinary tract through the urethra. E. coli from the GI tract is a common cause. Many variables affect diagnosis." },
      { title: "Common Symptoms", text: "Common UTI symptoms: pain/burning when urinating, lower belly pressure, fever/tiredness, bad-smelling or cloudy/reddish urine, frequent urge to urinate, and back/side pain below the ribs." },
      { title: "Urine Color Guide", text: "Urine color can indicate health issues: Clear/yellow is normal. Cloudy may signal a UTI. Red/pink could mean blood. Dark orange suggests dehydration. Green may indicate pseudomonas bacteria. Brown could be liver/kidney issues. Blue is a rare genetic condition." },
      { title: "Treatment", text: "UTIs are primarily treated with antibiotics. Symptoms typically improve within a few days. Your doctor may also prescribe pain medication to relieve burning while urinating." },
      { title: "Follow-up Care", text: "Most UTI patients improve within a few days, but about 90% are cured within 3-5 days. If symptoms persist, follow up with your doctor for urinalysis and further investigation." },
      { title: "Prevention", text: "To prevent UTIs: empty your bladder immediately after sexual intercourse and stay hydrated. Drinking plenty of water helps flush out bacteria. Cranberry tablets may also help prevent recurrence." },
      { title: "Telehealth Access", text: "Women 18+ with UTI symptoms can see an MDLIVE doctor by phone or video in as little as 15 minutes. The doctor can send prescriptions directly to your preferred pharmacy." },
    ],
  },
  {
    key: "rash-skin",
    label: "Rash / Skin Conditions",
    snippets: [
      { title: "Causes", text: "Common causes of rashes include poisonous plants (poison ivy/oak/sumac), insect bites, allergies, heat, medication reactions, chemical/latex sensitivity, viruses, and friction (intertrigo)." },
      { title: "Irritant Contact Dermatitis", text: "Irritant contact dermatitis causes redness, severe itching, swelling, bumps, and blisters from contact with irritating substances." },
      { title: "Eczema", text: "Eczema causes itchy, red, cracked, and rough skin. It is a chronic condition that can flare up periodically." },
      { title: "Insect Bites", text: "Insect bite rashes cause red, swollen skin, hives, intense itching, and burning sensations." },
      { title: "Heat Rash", text: "Heat rash causes small, stinging red lumps or clear, itchy liquid-filled bumps, usually from excessive heat and sweating." },
      { title: "Drug Reaction", text: "Drug reaction rashes appear as a side effect of certain medications. Consult your doctor if you suspect a medication is causing a rash." },
      { title: "Poison Ivy/Oak/Sumac", text: "Poison ivy, oak, or sumac rashes cause intensely itchy red blisters from contact with the plant oils." },
      { title: "Viral Rash", text: "Viral rashes appear as patches of splotchy red spots and are caused by viral infections. Some viral rashes can spread to others." },
      { title: "Intertrigo", text: "Intertrigo is a friction rash causing red/reddish-brown, raw, itchy, cracked skin, typically in skin folds." },
      { title: "Treatment — Medications", text: "Rash treatments include corticosteroid cream, antibiotics, prednisone, antihistamines, calamine lotion, medicated shampoos for scalp rashes, and menthol creams." },
      { title: "Treatment — Home Remedies", text: "Home remedies for rashes: oatmeal baths, cool compresses, avoid allergens like detergents and cleaning products, use a humidifier, and moisturize with fragrance-free hypoallergenic cream." },
      { title: "When to See a Doctor", text: "See a doctor if your rash lasts over a week, is getting worse, spreading, blistering, or painful. Seek emergency care if accompanied by fever, trouble breathing, or severe blistering." },
    ],
  },
  {
    key: "gut-health",
    label: "Gut Health / Digestive Wellness",
    snippets: [
      { title: "Introduction", text: "Your gut contains 100 trillion microbes that influence your overall health. Digestive diseases affect 1 in 5 Americans. Gut sounds like gurgling, burping, and gas signal whether your gut is healthy or needs attention." },
      { title: "Rumbling/Gurgling", text: "Stomach gurgling is normal during digestion. Seek care if excessive and accompanied by cramping, indigestion, nausea, diarrhea, bloating, or unexplained weight loss — could indicate IBS or food intolerances." },
      { title: "Burping", text: "Occasional burping is normal. Seek care if frequent and accompanied by stomach pain, throat burning, vomiting, or weight loss. May indicate GERD, gastritis, gallbladder disease, or H. pylori infection." },
      { title: "Stomach Pain/Digestion", text: "Slight, infrequent stomach pain is normal. Seek care if pain is new, sudden, radiates to the back, is severe, or comes with nausea/vomiting. Could indicate IBS, GERD, gallbladder disease, or kidney stones." },
      { title: "Gas", text: "Passing gas ~14 times daily is normal. Seek care if gas is excessive with pain, bloating, bloody stool, or fever. May indicate IBS, GERD, food intolerances, or bacterial overgrowth." },
      { title: "Gut-Brain Connection", text: "Your gut is your \"second brain\" — it produces 70-80% of your serotonin. An unhealthy gut can lead to depression, anxiety, and mood disorders. Taking care of your gut supports both physical and mental health." },
      { title: "Improving Gut Health", text: "Improve gut health by: managing stress, eating slowly, sleeping well, exercising regularly, checking for food intolerances, staying hydrated, and eating fermented/probiotic foods while reducing sugar and processed foods." },
    ],
  },
];

function buildConditionNodes(conditions: RawCondition[]): Record<string, SmartNode> {
  const nodes: Record<string, SmartNode> = {};
  const blogChip: SmartChip = { key: "blog", label: "Read more on our blog", action: "blog-placeholder" };
  const resetChip: SmartChip = { key: "reset", label: "Back to main menu", action: "reset" };

  for (const cond of conditions) {
    const condId = `cond-${cond.key}`;
    nodes[condId] = {
      id: condId,
      text: `What would you like to know about ${cond.label}?`,
      chips: cond.snippets.map((s) => ({ key: slug(s.title), label: s.title, goTo: `${condId}-${slug(s.title)}` })),
    };

    for (const snip of cond.snippets) {
      const snipId = `${condId}-${slug(snip.title)}`;
      if (snip.subSnippets) {
        nodes[snipId] = {
          id: snipId,
          text: `Which topic under "${snip.title}" would you like to know about?`,
          chips: snip.subSnippets.map((sub) => ({ key: slug(sub.title), label: sub.title, goTo: `${snipId}-${slug(sub.title)}` })),
        };
        for (const sub of snip.subSnippets) {
          const subId = `${snipId}-${slug(sub.title)}`;
          nodes[subId] = {
            id: subId,
            text: sub.text ?? "",
            chips: [
              ...snip.subSnippets
                .filter((s2) => s2 !== sub)
                .map((s2): SmartChip => ({ key: slug(s2.title), label: s2.title, goTo: `${snipId}-${slug(s2.title)}` })),
              blogChip,
              resetChip,
            ],
          };
        }
      } else {
        nodes[snipId] = {
          id: snipId,
          text: snip.text ?? "",
          chips: [
            ...cond.snippets
              .filter((s2) => s2 !== snip)
              .map((s2): SmartChip => ({ key: slug(s2.title), label: s2.title, goTo: `${condId}-${slug(s2.title)}` })),
            blogChip,
            resetChip,
          ],
        };
      }
    }
  }
  return nodes;
}

export const CONDITION_NODES: Record<string, SmartNode> = buildConditionNodes(RAW_CONDITIONS);

export interface ConditionOption {
  key: string;
  label: string;
  nodeId: string;
}

export const CONDITIONS: ConditionOption[] = RAW_CONDITIONS.map((c) => ({
  key: c.key,
  label: c.label,
  nodeId: `cond-${c.key}`,
}));
