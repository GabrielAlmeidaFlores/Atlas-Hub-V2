import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AnimateIn } from "@/components/animate-in";
import { MarketingShell } from "@/features/landing/components/marketing-shell";
import { CvmBanner } from "@/features/landing/components/cvm-banner";
import { WhatsappLink } from "@/components/shared/whatsapp-cta";
import { hasWhatsappSupport } from "@/lib/whatsapp";
import { useLandingAnalytics } from "@/lib/analytics/use-landing-analytics";

function QuemSomosHero(): ReactNode {
  const heroColor = "#001F4E";

  return (
    <section
      className="relative overflow-visible bg-gradient-to-b from-[#D1D1D6] via-[#E7E7EA] via-40% to-white to-65% px-4 pb-[40px] pt-5 sm:px-6 lg:px-8"
      data-analytics-section="hero"
    >
      <div className="relative overflow-hidden rounded-[14px] bg-[#001F4E] shadow-[0_10px_30px_rgba(7,17,34,0.18)]">
        <div className="relative min-h-[676px] overflow-hidden sm:hidden">
          <img
            src="/bg-quemsomos-mobile.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, ${heroColor} 0%, ${heroColor} 34%, ${heroColor}f2 42%, ${heroColor}d9 50%, ${heroColor}b3 58%, ${heroColor}80 66%, ${heroColor}4d 74%, ${heroColor}26 82%, transparent 92%)`,
            }}
            aria-hidden
          />
          <div className="relative z-10 px-6 pb-12 pt-8 text-left text-white">
            <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#D2A047]">
              Quem somos
            </p>
            <h1 className="text-[30px] font-extrabold uppercase leading-[1.12] tracking-[0.04em]">
              A CURADORIA
              <br />
              POR TRÁS
              <br />
              DE CADA PROJETO
            </h1>
            <p className="mt-5 text-[17px] font-medium leading-snug tracking-[-0.04em] text-[#D2A047]">
              Conheça a equipe e o propósito da Atlas Hub.
            </p>
            {hasWhatsappSupport() ? (
              <WhatsappLink
                variant="hero"
                message="Olá! Gostaria de falar com a equipe da Atlas Hub."
                data-analytics-cta="quemsomos_hero_whatsapp"
                className="mt-8 flex h-12 w-full items-center justify-center rounded-[4px] bg-[#D2A047] px-6 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90"
              >
                Fale com a nossa equipe
              </WhatsappLink>
            ) : (
              <a
                href="mailto:contato@atlashub.com.br"
                data-analytics-cta="quemsomos_hero_contato"
                className="mt-8 flex h-12 w-full items-center justify-center rounded-[4px] bg-[#D2A047] px-6 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90"
              >
                Fale com a nossa equipe
              </a>
            )}
          </div>
        </div>

        <img
          src="/bg-quemsomos.png"
          alt=""
          className="absolute inset-0 hidden h-full w-full object-cover object-center sm:block"
        />
        <div className="lp-container relative hidden min-h-[480px] items-center py-3 sm:flex lg:min-h-[600px] lg:py-4">
          <div className="relative z-10 max-w-[680px]">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#D2A047]">
              Quem somos
            </p>
            <h1 className="text-[32px] font-extrabold uppercase leading-[1.08] tracking-[0.04em] text-white md:text-[38px] lg:text-[44px]">
              A curadoria
              <br />
              por trás
              <br />
              de cada projeto
            </h1>
            <p className="mt-5 text-[22px] font-medium leading-relaxed tracking-[-0.03em] text-[#D2A047]">
              Conheça a equipe e o propósito da Atlas Hub.
            </p>
            {hasWhatsappSupport() ? (
              <WhatsappLink
                variant="hero"
                message="Olá! Gostaria de falar com a equipe da Atlas Hub."
                data-analytics-cta="quemsomos_hero_whatsapp"
                className="mt-8 !h-12 !w-fit rounded-[4px] !bg-[#D2A047] !px-6 !text-sm !font-semibold !text-white transition-opacity duration-200 hover:!opacity-90"
              >
                Fale com a nossa equipe
              </WhatsappLink>
            ) : (
              <a
                href="mailto:contato@atlashub.com.br"
                data-analytics-cta="quemsomos_hero_contato"
                className="mt-8 inline-flex h-12 items-center justify-center rounded-[4px] bg-[#D2A047] px-6 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90"
              >
                Fale com a nossa equipe
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function NossoProposito(): ReactNode {
  return (
    <section
      className="bg-white px-4 pb-10 pt-2 sm:px-6 sm:pb-12 lg:px-8"
      data-analytics-section="nosso-proposito"
    >
      <AnimateIn className="overflow-hidden rounded-[14px] shadow-[0_10px_30px_rgba(7,17,34,0.15)]">
          <div className="relative flex flex-col bg-gradient-to-r from-[#D2A047] to-[#E1C683] sm:min-h-[26rem] lg:min-h-[28rem] lg:flex-row lg:items-end">
            <div className="relative z-10 flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-12 lg:w-[55%] lg:px-12 lg:py-14">
              <h2 className="text-[36px] font-extrabold uppercase leading-[1.08] tracking-[-0.04em] text-[#6C4C14] sm:text-[44px] lg:text-[52px]">
                Nosso
                <br />
                propósito
              </h2>
              <div className="mt-6 space-y-5 text-[15px] font-medium leading-relaxed text-[#6C4C14] sm:text-[16px] lg:mt-8 lg:space-y-6">
                <p>
                  A AtlasHub conecta capital, ativos, projetos e oportunidades do mercado imobiliário, transformando boas ideias em negócios estruturados e capazes de gerar valor. Criamos pontes entre quem possui oportunidades e quem possui capital para viabilizá-las, oferecendo tecnologia, estrutura financeira, governança, transparência e acompanhamento em toda a jornada.
                </p>
                <p>
                  Mais do que uma plataforma de captação, somos um ecossistema que amplia o acesso a diferentes formas de investir, financiar e gerar renda por meio do mercado imobiliário.
                </p>
              </div>
            </div>
            <div className="relative z-10 flex flex-none items-end justify-end px-2 pb-0 sm:flex-1 sm:justify-center sm:px-4 lg:justify-end lg:px-6">
              <img
                src="/ilustracao.svg"
                alt=""
                className="h-auto w-full max-h-[12.6rem] origin-bottom-right -translate-y-3 -mb-3 scale-90 object-contain object-bottom object-right sm:mb-0 sm:max-h-[18rem] sm:translate-y-0 sm:scale-100 sm:object-center lg:max-h-[26rem] lg:w-auto lg:max-w-full"
              />
            </div>
          </div>
      </AnimateIn>
    </section>
  );
}

function MissaoValores(): ReactNode {
  return (
    <section className="bg-white py-14 lg:py-20" data-analytics-section="missao-valores">
      <div className="lp-container grid gap-12 lg:grid-cols-12 lg:gap-14">
        {/* Nossa Missão */}
        <AnimateIn className="lg:col-span-4">
          <div className="flex items-center gap-4">
            <svg width="74" height="74" viewBox="0 0 74 74" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden="true">
              <circle cx="37" cy="37" r="37" fill="#D9B366" />
              <g transform="translate(13, 13) scale(0.667)">
                <path d="M55.752 2.5127C61.1549 1.3768 65.9612 1.3444 69.2129 1.70117V1.70215C69.7813 1.76426 70.2368 2.21967 70.2988 2.78516V2.78613C70.6556 6.03804 70.6224 10.8439 69.4863 16.2471L55.752 2.5127Z" fill="#001F4E" stroke="#001F4E" strokeWidth="3" />
                <path d="M48.1934 4.77588C48.8925 4.50004 49.7147 4.6721 50.2695 5.22803L66.7705 21.729C67.3277 22.2851 67.4985 23.1067 67.2227 23.8032L67.2217 23.8042C65.3019 28.6569 62.3695 33.6162 57.9883 38.1196L57.5596 38.5542C49.2858 46.8298 41.0233 51.6444 34.2197 53.0034L33.5664 53.1235C31.989 53.3898 30.3758 52.8694 29.2363 51.73L20.2676 42.7612C19.1297 41.6246 18.609 40.0107 18.875 38.4331C20.0111 31.7252 24.602 23.5113 32.6543 15.2397L33.4443 14.439C38.062 9.81949 43.1842 6.75764 48.1934 4.77588ZM55.4688 16.5298C51.4634 12.5245 44.9698 12.5252 40.9629 16.5298H40.9619C36.9573 20.5367 36.9566 27.0312 40.9619 31.0366H40.9629C44.9698 35.0412 51.4634 35.0419 55.4688 31.0366C59.4742 27.0312 59.4734 20.5367 55.4688 16.5298Z" fill="#001F4E" stroke="#001F4E" strokeWidth="3" />
                <path d="M47.7803 53.4773C47.9707 53.3541 48.2027 53.3937 48.3398 53.5486L48.3926 53.6218C48.9706 54.6298 49.5235 55.9855 49.5479 57.4656C49.5713 58.8908 49.1095 60.5494 47.4531 62.2644C45.8259 63.9488 42.1364 67.6277 39.4785 70.2664C39.0329 70.7082 38.274 70.4811 38.1455 69.865L37.5791 67.1443L37.5752 67.1472L35.8613 58.9519L35.8604 58.9509C35.8157 58.7374 35.9454 58.5153 36.1777 58.4558C40.3089 57.3997 44.3001 55.7379 47.7812 53.4783L47.7803 53.4773Z" fill="#001F4E" stroke="#001F4E" strokeWidth="3" />
                <path d="M14.5322 22.4501C15.8274 22.4714 17.0274 22.897 17.9824 23.3905L18.376 23.6053C18.5631 23.7128 18.6405 23.9342 18.5625 24.1337L18.5195 24.2167C16.401 27.4803 14.8082 31.1924 13.7471 35.0477L13.542 35.8202C13.4825 36.0525 13.2604 36.1822 13.0469 36.1376H13.0459L4.84668 34.4218L4.85059 34.4188L2.13281 33.8524C1.55512 33.732 1.31925 33.0573 1.65625 32.6063L1.73145 32.5194C4.37012 29.8615 8.04801 26.171 9.73242 24.5438C11.4475 22.8875 13.107 22.4266 14.5322 22.4501Z" fill="#001F4E" stroke="#001F4E" strokeWidth="3" />
                <path d="M15.9912 46.9904L25.0091 56.0083" stroke="#001F4E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16.4597 55.5371L4.83203 67.1648" stroke="#001F4E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20.2202 59.2969L13.9082 65.6088" stroke="#001F4E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12.7019 51.7791L5.7168 58.7622" stroke="#001F4E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </svg>
            <div className="leading-none">
              <h3 className="text-[28px] font-extrabold uppercase tracking-tight text-[#001F4E] sm:text-[32px]">
                Nossa
              </h3>
              <span className="text-[28px] font-extrabold uppercase tracking-tight text-[#D2A047] sm:text-[32px]">
                Missão
              </span>
            </div>
          </div>
          <div className="mt-8 space-y-5 text-sm font-medium leading-relaxed text-[#1E1E1E] sm:text-[15px]">
            <p>
              Estruturar e conectar oportunidades imobiliárias ao capital necessário para transformá-las em negócios viáveis, transparentes e rentáveis.
            </p>
            <p>
              Por meio de tecnologia, inteligência financeira e governança, aproximamos investidores de empresas, proprietários, operadores e empreendedores, criando novas possibilidades de investimento e desenvolvimento no mercado imobiliário.
            </p>
          </div>
        </AnimateIn>

        {/* Nossos Valores */}
        <AnimateIn delay={80} className="lg:col-span-8">
          <div className="flex items-center gap-4">
            <svg width="74" height="74" viewBox="0 0 74 74" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden="true">
              <circle cx="37" cy="37" r="37" fill="#D9B366" />
              <g transform="translate(13, 14) scale(0.63)">
                <path d="M75.7504 32.0987C71.3748 27.8277 59.2544 17.8008 41.2582 16.9246C19.4881 15.865 4.83012 28.8256 0.855716 32.824C0.415069 33.2663 0.130448 33.8287 0.0344311 34.4494C-0.111309 35.3976 0.211033 36.3577 0.898581 37.023C4.72725 40.7213 18.281 52.2571 38.0999 52.2571C39.1835 52.2571 40.2894 52.2228 41.4108 52.1508C59.4979 50.9831 71.4828 40.6751 75.795 36.2977C76.2339 35.8519 76.5151 35.2895 76.6112 34.6706C76.7552 33.7276 76.4345 32.7657 75.7504 32.0987ZM50.2786 46.6075C47.4581 47.3602 44.4113 47.8917 41.1501 48.1026C35.7989 48.449 30.8935 47.8609 26.5093 46.7464C15.5806 43.9739 7.88379 37.9249 4.54721 34.8849C7.82378 31.7764 15.3971 25.5799 26.283 22.5982C30.6877 21.3911 35.636 20.7104 41.061 20.9745C44.2604 21.1305 47.2592 21.5986 50.0454 22.2861C60.8541 24.9438 68.4532 30.8453 72.1138 34.2351C68.5149 37.702 61.0342 43.7442 50.2786 46.6075Z" fill="#001F4E"/>
                <path d="M50.0449 22.2862C46.9981 19.3766 42.8693 17.5883 38.3223 17.5883C33.7752 17.5883 29.3567 19.5034 26.2825 22.5983C23.2339 25.6674 21.3496 29.8955 21.3496 34.5609C21.3496 39.2263 23.3265 43.6619 26.5088 46.7465C29.5642 49.7093 33.7289 51.5336 38.3223 51.5336C42.9156 51.5336 47.209 49.6527 50.2781 46.6076C53.3763 43.5333 55.2949 39.2709 55.2949 34.5609C55.2949 29.851 53.2803 25.3776 50.0449 22.2862ZM38.3223 48.053C30.8707 48.053 24.8302 42.0125 24.8302 34.5609C24.8302 27.1093 30.8707 21.0671 38.3223 21.0671C45.7738 21.0671 51.8143 27.1093 51.8143 34.5609C51.8143 42.0125 45.7738 48.053 38.3223 48.053ZM42.4664 32.3182C40.1774 32.3182 38.3223 30.4631 38.3223 28.1741C38.3223 27.2105 38.6498 26.3258 39.2036 25.6228C38.9138 25.5936 38.6189 25.5799 38.3223 25.5799C33.3123 25.5799 29.2521 29.6401 29.2521 34.6501C29.2521 39.6601 33.3123 43.7202 38.3223 43.7202C43.3323 43.7202 47.3924 39.6601 47.3924 34.6501C47.3924 32.9784 46.9415 31.4147 46.1511 30.0704C45.4652 31.4061 44.073 32.3182 42.4664 32.3182Z" fill="#001F4E"/>
                <path d="M46.1519 30.0703C45.466 31.406 44.0738 32.3181 42.4672 32.3181C40.1783 32.3181 38.3231 30.463 38.3231 28.174C38.3231 27.2104 38.6506 26.3257 39.2044 25.6227C38.9146 25.5936 38.6197 25.5798 38.3231 25.5798C33.3131 25.5798 29.2529 29.64 29.2529 34.65C29.2529 39.66 33.3131 43.7201 38.3231 43.7201C43.3331 43.7201 47.3932 39.66 47.3932 34.65C47.3932 32.9783 46.9423 31.4146 46.1519 30.0703Z" fill="white"/>
                <path d="M47.3932 34.65C47.3932 39.66 43.3331 43.7201 38.3231 43.7201C33.3131 43.7201 29.2529 39.66 29.2529 34.65C29.2529 29.64 33.3131 25.5798 38.3231 25.5798C38.6197 25.5798 38.9146 25.5936 39.2044 25.6227C38.6506 26.3257 38.3231 27.2104 38.3231 28.174C38.3231 30.463 40.1783 32.3181 42.4672 32.3181C44.0738 32.3181 45.466 31.406 46.1519 30.0703C46.9423 31.4146 47.3932 32.9783 47.3932 34.65Z" fill="#001F4E"/>
                <path d="M18.7062 69.1201H12.6092C8.06554 69.1201 4.36719 65.4235 4.36719 60.8781V53.4437C4.36719 52.4852 5.14389 51.7068 6.10406 51.7068C7.06423 51.7068 7.84093 52.4835 7.84093 53.4437V60.8781C7.84093 63.5083 9.98073 65.6463 12.6092 65.6463H18.7062C19.6647 65.6463 20.4431 66.4231 20.4431 67.3832C20.4431 68.3434 19.6664 69.1201 18.7062 69.1201Z" fill="#001F4E"/>
                <path d="M64.0356 69.1201H58.2437C57.2853 69.1201 56.5068 68.3434 56.5068 67.3832C56.5068 66.4231 57.2835 65.6463 58.2437 65.6463H64.0356C66.6657 65.6463 68.8055 63.5065 68.8055 60.8781V53.4437C68.8055 52.4852 69.5822 51.7068 70.5424 51.7068C71.5026 51.7068 72.2793 52.4835 72.2793 53.4437V60.8781C72.2793 65.4235 68.5826 69.1201 64.0373 69.1201H64.0356Z" fill="#001F4E"/>
                <path d="M70.5418 15.8102C69.5834 15.8102 68.805 15.0335 68.805 14.0733V8.53862C68.805 5.74557 66.5331 3.47375 63.7401 3.47375H58.4986C57.5401 3.47375 56.7617 2.69704 56.7617 1.73687C56.7617 0.776706 57.5384 0 58.4986 0H63.7401C68.4483 0 72.277 3.83038 72.277 8.53691V14.0716C72.277 15.03 71.5003 15.8085 70.5401 15.8085L70.5418 15.8102Z" fill="#001F4E"/>
                <path d="M6.10406 15.8102C5.14561 15.8102 4.36719 15.0335 4.36719 14.0733V8.24371C4.36719 3.69835 8.06383 0.00170898 12.6092 0.00170898H17.566C18.5245 0.00170898 19.3029 0.778415 19.3029 1.73858C19.3029 2.69875 18.5262 3.47545 17.566 3.47545H12.6092C9.97902 3.47545 7.84093 5.61525 7.84093 8.24371V14.0733C7.84093 15.0317 7.06423 15.8102 6.10406 15.8102Z" fill="#001F4E"/>
                <path d="M38.3229 12.6331C37.7622 12.6331 37.3096 12.1787 37.3096 11.6197V6.57887C37.3096 6.0182 37.7639 5.56555 38.3229 5.56555C38.8818 5.56555 39.3362 6.01992 39.3362 6.57887V11.6197C39.3362 12.1804 38.8818 12.6331 38.3229 12.6331Z" fill="#001F4E"/>
                <path d="M26.8081 15.7192C26.4583 15.7192 26.1171 15.5375 25.9285 15.2117L23.4081 10.8464C23.1286 10.3611 23.2949 9.74217 23.7801 9.46098C24.2654 9.1815 24.8843 9.34782 25.1655 9.83133L27.6859 14.1967C27.9654 14.6819 27.7991 15.3009 27.3139 15.582C27.1544 15.6746 26.9795 15.7175 26.8081 15.7175V15.7192Z" fill="#001F4E"/>
                <path d="M49.7976 15.6764C49.6262 15.6764 49.4513 15.6318 49.2918 15.5409C48.8066 15.2615 48.6403 14.6408 48.9198 14.1556L51.4402 9.79023C51.7197 9.305 52.3404 9.13869 52.8256 9.41988C53.3108 9.69936 53.4771 10.32 53.1977 10.8053L50.6772 15.1706C50.4886 15.4964 50.1491 15.6781 49.7976 15.6781V15.6764Z" fill="#001F4E"/>
                <path d="M38.3229 63.5562C37.7622 63.5562 37.3096 63.1018 37.3096 62.5428V57.502C37.3096 56.9413 37.7639 56.4886 38.3229 56.4886C38.8818 56.4886 39.3362 56.943 39.3362 57.502V62.5428C39.3362 63.1035 38.8818 63.5562 38.3229 63.5562Z" fill="#001F4E"/>
                <path d="M24.2859 59.7961C24.1145 59.7961 23.9396 59.7516 23.7801 59.6607C23.2949 59.3812 23.1286 58.7605 23.4081 58.2753L25.9285 53.91C26.208 53.4248 26.8287 53.2584 27.3139 53.5396C27.7991 53.8191 27.9654 54.4398 27.6859 54.925L25.1655 59.2903C24.9769 59.6161 24.6374 59.7979 24.2859 59.7979V59.7961Z" fill="#001F4E"/>
                <path d="M52.3198 59.839C51.97 59.839 51.6288 59.6572 51.4402 59.3314L48.9198 54.9661C48.6403 54.4809 48.8066 53.8619 49.2918 53.5807C49.7771 53.3013 50.396 53.4676 50.6772 53.9511L53.1977 58.3164C53.4771 58.8016 53.3108 59.4206 52.8256 59.7018C52.6661 59.7944 52.4913 59.8373 52.3198 59.8373V59.839Z" fill="#001F4E"/>
              </g>
            </svg>
            <div className="leading-none">
              <h3 className="text-[28px] font-extrabold uppercase tracking-tight text-[#001F4E] sm:text-[32px]">
                Nossos
              </h3>
              <span className="text-[28px] font-extrabold uppercase tracking-tight text-[#D2A047] sm:text-[32px]">
                Valores
              </span>
            </div>
          </div>
          <div className="mt-8 grid gap-x-8 gap-y-2 sm:grid-cols-2 text-sm leading-relaxed text-[#1E1E1E] sm:text-[14.5px]">
            <div className="space-y-2">
              <p>
                <span className="text-[#D2A047] font-semibold">• Transparência:</span> Clareza em todas as etapas e informações relevantes para cada decisão.
              </p>
              <p>
                <span className="text-[#D2A047] font-semibold">• Alinhamento:</span> Construímos negócios buscando o equilíbrio entre os interesses de todas as partes.
              </p>
              <p>
                <span className="text-[#D2A047] font-semibold">• Responsabilidade:</span> Tratamos o capital e as oportunidades com disciplina e diligência.
              </p>
              <p>
                <span className="text-[#D2A047] font-semibold">• Fundamentos:</span> Valorizamos projetos sustentados por viabilidade, dados e geração real de valor.
              </p>
              <p>
                <span className="text-[#D2A047] font-semibold">• Governança:</span> Processos claros, acompanhamento e prestação de contas.
              </p>
            </div>
            <div className="space-y-2">
              <p>
                <span className="text-[#D2A047] font-semibold">• Tecnologia:</span> Simplificamos o acesso e a conexão entre capital e oportunidades.
              </p>
              <p>
                <span className="text-[#D2A047] font-semibold">• Inovação:</span> Buscamos novos modelos que resolvam problemas reais e criem valor.
              </p>
              <p>
                <span className="text-[#D2A047] font-semibold">• Execução:</span> Transformamos boas oportunidades em resultados concretos.
              </p>
              <p>
                <span className="text-[#D2A047] font-semibold">• Confiança:</span> Construímos relações sólidas e de longo prazo.
              </p>
              <p>
                <span className="text-[#D2A047] font-semibold">• Acesso:</span> Ampliamos o acesso às oportunidades do mercado imobiliário.
              </p>
            </div>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}

function Parceiros(): ReactNode {
  const logos = [
    { src: "/swiss.svg", alt: "Swiss Capital", className: "h-[5.5rem] w-auto max-w-[11rem] object-contain sm:h-[7.6rem] sm:max-w-[15.2rem] lg:h-[8.85rem] lg:max-w-[17.7rem]" },
    { src: "/advogados.svg", alt: "Wilson & Pinheiro Advogados", className: "h-[4.75rem] w-auto max-w-[13rem] object-contain sm:h-[6.35rem] sm:max-w-[19rem] lg:h-[7.6rem] lg:max-w-[22.8rem]" },
  ];

  return (
    <section className="bg-[#D5A650] py-14 sm:py-[5.18rem] lg:py-[6.2rem]" data-analytics-section="parceiros">
      <div className="lp-container flex flex-col items-center gap-10 sm:gap-12 lg:flex-row lg:items-center lg:gap-12">
        <AnimateIn className="w-full shrink-0 text-center lg:text-left">
          <h2 className="mx-auto max-w-md text-[1.65rem] font-extrabold uppercase leading-[1.1] tracking-tight text-[#6C4C14] sm:text-[2.15rem] lg:text-[2.25rem]">
            Equipe
            <br />
            responsável
            <br />
            pela curadoria
          </h2>
        </AnimateIn>
        <AnimateIn delay={80} className="flex w-full max-w-sm flex-col items-center gap-12 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center sm:gap-12 lg:flex-1 lg:justify-center xl:gap-16">
          {logos.map(({ src, alt, className }) => (
            <img key={alt} src={src} alt={alt} className={className} />
          ))}
        </AnimateIn>
      </div>
    </section>
  );
}

export default function QuemSomosPage(): ReactNode {
  useLandingAnalytics(true);
  return (
    <MarketingShell>
      <QuemSomosHero />
      <NossoProposito />
      <MissaoValores />
      <CvmBanner
        sectionClassName="!pb-16 !pt-12 sm:!pt-12 lg:!pb-20 lg:!pt-16"
        shellClassName="max-w-3xl sm:w-[90%] lg:w-[73%]"
      />
      <Parceiros />
    </MarketingShell>
  );
}
