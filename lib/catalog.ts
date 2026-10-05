import type { Design, Palette } from '@/types/design';

export const siteTypes = ['متجر إلكتروني','موقع شركة','موقع شخصي','مطعم أو كوفي','عيادة طبية','منصة تعليمية','عقارات','موقع حجوزات','خدمات','Landing Page','موقع مخصص'];
export const palettes: Palette[] = [
  ['luxury','Luxury Black','#171717','#555555','#b5a78c','#f6f4f0','#171717'],
  ['gold','Elegant Gold','#8b6b34','#d0b376','#b58a43','#faf8f3','#252015'],
  ['blue','Modern Blue','#315de6','#8bafff','#6d88f0','#f7f9fe','#172546'],
  ['green','Nature Green','#2d6b52','#a7cdb4','#779c64','#f7faf5','#193c2b'],
  ['white','Clean White','#242424','#bcbcbc','#828282','#ffffff','#202020'],
  ['purple','Creative Purple','#7556c7','#b5a4eb','#ae8df1','#faf8ff','#28213c'],
  ['navy','Corporate Navy','#142f5b','#5373a4','#699bbd','#f5f8fc','#142238'],
  ['beige','Warm Beige','#896b54','#cbb49d','#a48067','#fbf7f1','#36291e'],
  ['gray','Minimal Gray','#454b54','#a9adb4','#858d98','#f7f8fa','#242932'],
  ['pastel','Soft Pastel','#8c72ac','#c8b8df','#e1aebd','#fcf9fc','#3c3048'],
  ['red','Bold Red','#a92f39','#e1a0a6','#cf4d54','#fff8f8','#35191c'],
  ['custom','Custom Colors','#6c5ce7','#b6adf5','#a892ff','#ffffff','#22223a'],
].map(([id,name,primary,secondary,accent,background,text])=>({id,name,primary,secondary,accent,background,text}));
export const navNames = ['كلاسيكي','متمركز','عائم','شفاف','زجاجي','بسيط','جانبي','منقسم','مستدير','بعرض كامل','قائمة كبيرة','شريط علوي','مزدوج','تحريري','بحدود','شعار مركزي','داكن','مضغوط','مكدس','إبداعي'];
export const heroNames = ['متمركز','مقسوم','صورة كاملة','سينمائي','تدرج لوني','بسيط','تحريري','عرض منتج','زجاجي','فاخر داكن','بطاقة عائمة','صورة جانبية','إحصائيات','شريط علوي','خط كبير','طبقات','مجلة','بحدود','منحني','مائل'];
export const footerNames = ['بسيط','أعمدة','داكن','إبداعي','نشرة بريدية','شركات','عنوان ضخم','اجتماعي','متمركز','منقسم','بطاقات','بحدود','زجاجي','تحريري','متدرج'];
export const sectionKinds = ['نبذة عنا','خدمات','شبكة منتجات','عرض منتج','مميزات','أسعار','آراء العملاء','معرض صور','أسئلة شائعة','تواصل','فريق العمل','إحصائيات','معرض أعمال','مدونة','حجز موعد','دعوة للإجراء','شركاؤنا','خطوات العمل','قيمنا','شهادات','مقارنة الخطط','جدول مواعيد','مشاريع حديثة','قصة العلامة','الفعاليات','تحميل التطبيق','المواقع','رسالة المؤسس','ضماناتنا','اشترك الآن'];
export const sectionKindEnglish:Record<string,string> = Object.fromEntries(sectionKinds.map((kind,index)=>[kind,['About us','Services','Product grid','Product feature','Features','Pricing','Testimonials','Gallery','FAQ','Contact','Team','Statistics','Portfolio','Blog','Booking','Call to action','Partners','Process','Values','Reviews','Plan comparison','Schedule','Recent projects','Brand story','Events','Download app','Locations','Founder message','Guarantees','Subscribe'][index]]));
export const fonts = ['Cairo','Tajawal','IBM Plex Sans Arabic','Almarai','Inter','Poppins'];
export const siteProfiles:Record<string,{title:string;body:string;button:string;sections:[string,string][]}>={
 'متجر إلكتروني':{title:'تفاصيل تصنع الفرق.',body:'اكتشف مجموعة منتقاة بعناية، صُممت لترافق لحظاتك الأجمل.',button:'استكشف المجموعة',sections:[['مميزات','لأن التفاصيل تهم'],['شبكة منتجات','اختيارات تستحق الاكتشاف'],['آراء العملاء','كلمات من عملائنا']]},
 'موقع شركة':{title:'أفكار طموحة. نتائج حقيقية.',body:'نحوّل التحديات إلى فرص، ونبني حلولًا تدفع أعمالك إلى الأمام.',button:'اكتشف خدماتنا',sections:[['نبذة عنا','شريكك في النجاح'],['خدمات','حلول صُممت لأعمالك'],['إحصائيات','أرقام تروي قصتنا']]},
 'موقع شخصي':{title:'مرحبًا، هذه مساحتي.',body:'أشارك هنا مشاريعي وأفكاري والقصص التي صنعت مسيرتي.',button:'استكشف أعمالي',sections:[['نبذة عنا','من أنا'],['معرض أعمال','أعمال مختارة'],['تواصل','لنبقَ على تواصل']]},
 'موقع حجوزات':{title:'احجز وقتك بكل سهولة.',body:'اختر الموعد الذي يناسبك، وسنهتم بتأكيد حجزك بسرعة.',button:'احجز الآن',sections:[['خدمات','خدماتنا'],['حجز موعد','المواعيد المتاحة'],['تواصل','هل تحتاج مساعدة؟']]},
 'مطعم أو كوفي':{title:'لحظات لها مذاق خاص.',body:'نكهات محضّرة بشغف، وأجواء تجعل كل زيارة تجربة تستحق التكرار.',button:'استعرض القائمة',sections:[['قصة العلامة','قصتنا مع النكهة'],['معرض صور','من أطباقنا'],['حجز موعد','احجز طاولتك']]},
 'عيادة طبية':{title:'رعاية تضعك أولًا.',body:'فريق متخصص وتجربة مريحة لأن صحتك تستحق الاهتمام الأفضل.',button:'احجز موعدًا',sections:[['خدمات','خدماتنا الطبية'],['فريق العمل','تعرف على أطبائنا'],['حجز موعد','ابدأ رحلتك الصحية']]},
 'منصة تعليمية':{title:'خطوتك التالية تبدأ هنا.',body:'تعلم المهارات التي تفتح أمامك فرصًا جديدة، بالوتيرة التي تناسبك.',button:'استكشف الدورات',sections:[['مميزات','تعلم بطريقة مختلفة'],['شبكة منتجات','مسارات التعلم'],['آراء العملاء','قصص المتعلمين']]},
 'عقارات':{title:'مساحة تشبه طموحك.',body:'اكتشف عقارات مختارة بعناية، حيث تجتمع الراحة بالموقع المناسب.',button:'استكشف العقارات',sections:[['شبكة منتجات','عقارات مميزة'],['خدمات','رحلتك تبدأ معنا'],['تواصل','تحدث إلى مستشار']]},
 'خدمات':{title:'حلول تصنع الفرق.',body:'خدمات متقنة تلائم أهدافك وتمنح مشروعك دفعة واضحة إلى الأمام.',button:'اطلب الخدمة',sections:[['خدمات','ما نقدمه لك'],['خطوات العمل','كيف نعمل'],['آراء العملاء','تجارب عملائنا']]},
 'Landing Page':{title:'فكرة واحدة. أثر كبير.',body:'كل ما تحتاج معرفته في تجربة واضحة تقودك إلى الخطوة التالية.',button:'ابدأ الآن',sections:[['مميزات','لماذا تختارنا'],['أسعار','اختر خطتك'],['أسئلة شائعة','أسئلة وإجابات']]},
 'موقع مخصص':{title:'مساحة جديدة لأفكارك.',body:'هوية رقمية مرنة تنطلق من فكرتك وتتشكل حول احتياجاتك.',button:'تواصل معنا',sections:[['نبذة عنا','عن المشروع'],['خدمات','ما الذي نقدمه'],['تواصل','لنتحدث']]}
};
export const defaultDesign: Design = { version:1, projectName:'مشروعي الجديد',siteType:'متجر إلكتروني',locale:'ar',palette:palettes[0],style:'modern',font:'Cairo',headingScale:1,fontWeight:700,letterSpacing:0,navbar:0,navbarSettings:{sticky:false,transparent:false,showCta:true,showLanguageSwitcher:false},navCta:'تواصل معنا',logoImage:'',hero:1,heroTitle:'تفاصيل تصنع الفرق.',heroBody:'اكتشف مجموعة منتقاة بعناية، صُممت لترافق لحظاتك الأجمل.',heroImage:'',buttonLabel:'استكشف المجموعة',sections:[{id:'features-1',kind:'مميزات',variant:0,title:'لأن التفاصيل تهم',body:'جودة استثنائية، تجربة سلسة، وعناية بكل اختيار.',visible:true},{id:'products-1',kind:'شبكة منتجات',variant:0,title:'اختيارات تستحق الاكتشاف',body:'منتجات مختارة بعناية لتناسب أسلوبك.',visible:true},{id:'testimonials-1',kind:'آراء العملاء',variant:0,title:'كلمات من عملائنا',body:'تجارب حقيقية تحكي قصتنا.',visible:true}],features:[],buttonStyle:'rounded',cardStyle:'soft',radius:16,shadow:20,footer:1,footerTagline:'نصنع تجارب تبقى في الذاكرة.',contactEmail:'hello@example.com',contactPhone:'+968 0000 0000',motion:'fade',pages:['الرئيسية','من نحن','الخدمات','تواصل معنا'] };
