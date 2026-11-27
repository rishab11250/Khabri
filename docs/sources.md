# Verified Catalog Sources

Checked on **2026-11-25** using `User-Agent: KhabriBot/1.0 (+https://github.com/rishab11250/Khabri)`.
All included sources returned HTTP `200 text/html` and allow root/public notice crawling per `/robots.txt`.

| # | Name | Category | State | Type | URL | `robots.txt` check | Terms / Notes |
|---|---|---|---|---|---|---|---|
| 1 | SSC Notices | recruitment | All India | listing | https://ssc.gov.in/ | 404 (no restrictions) | Official central recruitment board; public notices only, no login |
| 2 | CUET UG NTA | exam | All India | listing | https://cuet.nta.nic.in/ | 200 (`Disallow: /wp-admin/` only) | Official NTA entrance portal; public notices allowed |
| 3 | CBSE Academic | exam | All India | listing | https://cbseacademic.nic.in/ | 404 (no restrictions) | Official CBSE academic circulars; public notices only |
| 4 | GATE 2026 (IITG) | exam | All India | page | https://gate2026.iitg.ac.in/ | 404 (no restrictions) | Official GATE 2026 portal; schedule & announcements |
| 5 | IIT JAM 2026 (IITB) | exam | All India | page | https://jam2026.iitb.ac.in/ | 404 (no restrictions) | Official IIT JAM portal; public exam updates |
| 6 | IBPS Recruitment | recruitment | All India | listing | https://www.ibps.in/ | 404 (no restrictions) | Official banking recruitment portal; public notifications |
| 7 | ISRO Careers | recruitment | All India | listing | https://www.isro.gov.in/Careers.html | 404 (no restrictions) | Official ISRO recruitment notices |
| 8 | SBI Careers | recruitment | All India | listing | https://sbi.co.in/web/careers | 200 (`Disallow:` empty) | Official SBI recruitment updates; sitemap advertised |
| 9 | MPSC Maharashtra | recruitment | Maharashtra | listing | https://mpsc.gov.in/ | 200 (`Allow: /`, blocks `/mpscadmin/`) | Official state PSC; public front-page notices allowed |
| 10 | National Scholarship Portal | scholarship | All India | page | https://scholarships.gov.in/ | 404 (no restrictions) | Official central scholarship portal; public guidelines/dates |
| 11 | Digital Gujarat Scholarships | scholarship | Gujarat | page | https://www.digitalgujarat.gov.in/ | 200 (HTML fallback, no disallow) | Official Gujarat state portal; public scholarship announcements |
| 12 | PM Internship Scheme (MCA) | scheme | All India | page | https://pminternship.mca.gov.in/ | 200 (`Allow: /guidelines/`, `/FAQs/`) | Official central scheme portal; public pages allowed |
| 13 | MyGov India | scheme | All India | listing | https://www.mygov.in/ | 200 (no general disallow) | Official citizen-scheme engagement portal |
| 14 | UGC Notices | university | All India | listing | https://www.ugc.gov.in/Notices | 200 (HTML fallback, no disallow) | Official University Grants Commission public notices |
| 15 | Delhi University | university | Delhi | listing | https://www.du.ac.in/ | 404 (no restrictions) | Official central university portal; public admissions/notices |

## Demo Source
- **Khabri Demo Notice Board** (`isDemo: true`, `listing`, `official`): served locally at `/demo/board` for repeatable demos without depending on external sites.

## Excluded during verification
- `upsc.gov.in/whats-new`, `pib.gov.in`, `jeemain.nta.nic.in`, `neet.nta.nic.in`, `india.gov.in`, `cbse.gov.in`, `gtu.ac.in`: returned HTTP `403` to automated bot user-agent.
- `nta.ac.in`, `aicte-india.org`, `gpsc.gujarat.gov.in`, `ignou.ac.in`: timed out or reset connection during check.
