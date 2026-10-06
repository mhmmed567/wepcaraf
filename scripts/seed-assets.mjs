import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw Error('Supabase server settings are missing.');
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const assets = [
  {
    id: 'asset-nova-landing', category: 'template', framework: 'html', title: 'قالب نوفا للأعمال', titleEn: 'Nova business landing',
    description: 'صفحة افتتاحية أنيقة لمشروعك مع دعوة واضحة للتواصل.', descriptionEn: 'A polished business landing page with a clear call to action.', price: 120, published: true,
    html: '<main class="nova"><nav><b>NOVA<span>✦</span></b><a href="#contact">تواصل معنا</a></nav><section><small>تجربة رقمية تليق بفكرتك</small><h1>نصنع حضورك<br><em>بشكل مختلف.</em></h1><p>مساحة أنيقة لعرض خدماتك وتحويل الزوار إلى عملاء.</p><a class="cta" href="#contact">ابدأ مشروعك ←</a></section><footer id="contact">NOVA STUDIO · 2026</footer></main>',
    css: '.nova{min-height:100vh;background:#16142a;color:#fff;direction:rtl;padding:24px 6%;position:relative;overflow:hidden}.nova:before{content:"";position:absolute;width:380px;height:380px;border-radius:50%;background:#7448df;filter:blur(110px);top:4%;left:0;opacity:.6}.nova nav,.nova section,.nova footer{position:relative}.nova nav{display:flex;justify-content:space-between;align-items:center}.nova nav b{font-size:22px}.nova nav b span{color:#a084ff}.nova nav a{color:#dcd5f4;text-decoration:none;font-size:13px}.nova section{padding:70px 0 65px;max-width:600px}.nova small{color:#b7a1ff;letter-spacing:.1em}.nova h1{font-size:clamp(34px,5vw,66px);line-height:1.15;margin:18px 0}.nova h1 em{color:#b59bff;font-style:normal}.nova p{color:#c6bedb;line-height:1.8}.nova .cta{display:inline-block;margin-top:18px;padding:13px 22px;border-radius:10px;background:#9a73fc;color:white;text-decoration:none;font-weight:700}.nova footer{border-top:1px solid #5a536f;color:#978da9;padding-top:16px;font-size:11px}', js: '', nextCode: '',
  },
  {
    id: 'asset-orbit-button', category: 'button', framework: 'html', title: 'زر أوربت المتوهج', titleEn: 'Orbit glow button',
    description: 'زر تفاعلي متدرج مع تأثير ضوئي وحركة خفيفة.', descriptionEn: 'A gradient action button with a glow and subtle motion.', price: 8, published: true,
    html: '<div class="stage"><button class="orbit" type="button"><span>اكتشف المزيد</span><span aria-hidden="true">↗</span></button></div>',
    css: '.stage{min-height:100vh;display:grid;place-items:center;background:#eee9ff}.orbit{border:1px solid #ccb2ff;background:linear-gradient(120deg,#713fe0,#a26aff);color:#fff;padding:17px 24px;border-radius:16px;font:bold 20px system-ui;display:flex;align-items:center;gap:28px;cursor:pointer;box-shadow:0 14px 30px #784bd765;transition:transform .25s,box-shadow .25s}.orbit:hover{transform:translateY(-5px);box-shadow:0 20px 42px #784bd795}.orbit:active{transform:translateY(1px)}.orbit span:last-child{font-size:26px}', js: '', nextCode: '',
  },
  {
    id: 'asset-pricing-card', category: 'component', framework: 'html', title: 'بطاقة تسعير تفاعلية', titleEn: 'Interactive pricing card',
    description: 'بطاقة سعر منظمة مع مزايا واضحة وزر تواصل.', descriptionEn: 'A clean price card with benefits and a contact action.', price: 25, published: true,
    html: '<div class="wrap"><article class="plan"><div class="head"><span>الخطة المميزة</span><b>✦</b></div><h2>كل ما تحتاجه لتبدأ</h2><p>تصميم متجاوب، صفحات أساسية، ومعاينة قبل التنفيذ.</p><div class="price">٢٥ <small>ر.ع / بداية من</small></div><ul><li>✓ تصميم مخصص</li><li>✓ متوافق مع الهاتف</li><li>✓ تحديثات المحتوى</li></ul><button type="button">اختر هذه الخطة ←</button></article></div>',
    css: '.wrap{background:#f5f3fa;min-height:100vh;display:grid;place-items:center;direction:rtl;padding:20px}.plan{background:#fff;border:1px solid #e8e2f2;box-shadow:0 25px 50px #34275c1a;padding:30px;border-radius:24px;max-width:390px;width:100%;color:#282333}.head{display:flex;justify-content:space-between;color:#7b55db;font-weight:800}.head b{font-size:28px}.plan h2{font-size:25px;margin:12px 0}.plan p{color:#756b80;line-height:1.7}.price{font-size:40px;color:#7b55db;font-weight:900;margin:15px 0}.price small{font-size:13px;color:#8a8095}.plan ul{list-style:none;padding:0;line-height:2.3;color:#4b4256}.plan button{width:100%;padding:14px;border:0;border-radius:12px;background:#7b55db;color:white;font-weight:800;cursor:pointer}', js: '', nextCode: '',
  },
  {
    id: 'asset-faq-accordion', category: 'script', framework: 'html', title: 'أسئلة شائعة قابلة للفتح', titleEn: 'FAQ accordion',
    description: 'قسم أسئلة شائعة يعمل بـ JavaScript بسيط.', descriptionEn: 'An accessible FAQ block powered by a tiny JavaScript snippet.', price: 15, published: true,
    html: '<main class="faq"><h2>أسئلة شائعة</h2><button type="button" aria-expanded="false">كم يستغرق تنفيذ الموقع؟ <span>+</span></button><p hidden>يعتمد على حجم المشروع، وعادة يبدأ من أسبوعين.</p><button type="button" aria-expanded="false">هل يمكن تعديل التصميم؟ <span>+</span></button><p hidden>نعم، يمكنك مراجعة التصميم قبل اعتماده.</p></main>',
    css: '.faq{min-height:100vh;background:#f8f5ff;padding:38px;direction:rtl;color:#29203e}.faq h2{font-size:30px}.faq button{width:100%;display:flex;justify-content:space-between;align-items:center;background:white;border:1px solid #e8defb;padding:17px;border-radius:12px;margin-top:10px;font:700 17px system-ui;color:#382c50;cursor:pointer}.faq button span{color:#8b62ed}.faq p{background:#fff;margin:0;padding:17px;color:#756a83;border-radius:0 0 12px 12px}',
    js: 'document.querySelectorAll(".faq button").forEach(button => { button.addEventListener("click", () => { const open = button.getAttribute("aria-expanded") === "true"; button.setAttribute("aria-expanded", String(!open)); button.nextElementSibling.hidden = open; button.querySelector("span").textContent = open ? "+" : "−"; }); });', nextCode: '',
  },
  {
    id: 'asset-next-portfolio', category: 'template', framework: 'nextjs', title: 'واجهة ملف أعمال Next.js', titleEn: 'Next.js portfolio hero',
    description: 'مكوّن React / Next.js لواجهة ملف أعمال مع معاينة HTML مستقلة.', descriptionEn: 'A React / Next.js portfolio hero with an independent HTML preview.', price: 60, published: true,
    html: '<main class="portfolio"><nav><b>AMIR<span>.</span></b><small>الأعمال · عني · تواصل</small></nav><div class="hero"><span>مصمم ومطور واجهات</span><h1>أحوّل الأفكار إلى<br><em>تجارب رقمية.</em></h1><p>أبني مواقع سريعة وواضحة تستحق أن يتذكرها الناس.</p><a href="#work">شاهد أعمالي ↗</a></div><div class="work" id="work">مشاريع مختارة <span>01 / 03</span></div></main>',
    css: '.portfolio{min-height:100vh;background:#ece8e1;color:#222;direction:rtl;padding:24px 6%}.portfolio nav{display:flex;justify-content:space-between}.portfolio nav b{font-size:24px}.portfolio nav b span{color:#d55433}.portfolio nav small{color:#635f5b}.hero{padding:75px 0 65px}.hero>span{color:#c95335;font-weight:700}.hero h1{font-size:clamp(34px,5vw,64px);line-height:1.13;letter-spacing:-.02em;margin:15px 0}.hero em{font-style:normal;color:#d55433}.hero p{color:#5e5954}.hero a{display:inline-block;margin-top:12px;color:#fff;background:#252424;border-radius:100px;padding:13px 22px;text-decoration:none}.work{border-top:1px solid #b5ada5;padding-top:15px;display:flex;justify-content:space-between}.work span{color:#8d8379}', js: '',
    nextCode: `import Link from 'next/link';

export default function PortfolioHero() {
  return (
    <main className="portfolio">
      <nav><strong>AMIR.</strong><span>الأعمال · عني · تواصل</span></nav>
      <section>
        <p>مصمم ومطور واجهات</p>
        <h1>أحوّل الأفكار إلى <em>تجارب رقمية.</em></h1>
        <p>أبني مواقع سريعة وواضحة تستحق أن يتذكرها الناس.</p>
        <Link href="#work">شاهد أعمالي ↗</Link>
      </section>
    </main>
  );
}
// Add the styles from the CSS tab to your global CSS file.`,
  },
];

const rows = assets.map(data => ({ id: data.id, data }));
const { error } = await db.from('catalog_components').upsert(rows, { onConflict: 'id', ignoreDuplicates: true });
if (error) throw error;
console.log(`Seeded or preserved ${rows.length} code library items.`);
