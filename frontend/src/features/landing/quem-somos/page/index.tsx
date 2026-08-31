import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AnimateIn } from "@/components/animate-in";
import { MarketingShell } from "@/features/landing/components/marketing-shell";
import { WhatsappLink } from "@/components/shared/whatsapp-cta";
import { hasWhatsappSupport } from "@/lib/whatsapp";
import { useLandingAnalytics } from "@/lib/analytics/use-landing-analytics";

function QuemSomosHero(): ReactNode {
  return (
    <section
      className="relative overflow-visible bg-gradient-to-b from-[#D1D1D6] via-[#E7E7EA] via-40% to-white to-65% px-4 pb-[40px] pt-5 sm:px-6 lg:px-8"
      data-analytics-section="hero"
    >
      <div className="relative min-h-[557px] overflow-hidden rounded-[14px] bg-[#001F4E] shadow-[0_10px_30px_rgba(7,17,34,0.18)] lg:min-h-[600px]">
        <img
          src="/bg-quemsomos.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="lp-container relative flex min-h-[557px] items-center py-3 lg:min-h-[600px] lg:py-4">
          <div className="relative z-10 max-w-[680px]">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#D2A047]">
              Quem somos
            </p>
            <h1 className="text-[32px] font-extrabold uppercase leading-[1.08] tracking-[0.04em] text-white sm:text-[38px] lg:text-[44px]">
              A curadoria
              <br />
              por trás
              <br />
              de cada projeto
            </h1>
            <p className="mt-5 text-[18px] font-medium leading-relaxed tracking-[-0.03em] text-[#D2A047] sm:text-[22px]">
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
          <div className="relative flex min-h-[22rem] flex-col bg-gradient-to-r from-[#D2A047] to-[#E1C683] sm:min-h-[26rem] lg:min-h-[28rem] lg:flex-row lg:items-end">
            <div className="relative z-10 flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:w-[55%] lg:px-12 lg:py-14">
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
            <div className="relative z-10 flex flex-1 items-end justify-center px-4 pb-0 lg:justify-end lg:px-6">
              <img
                src="/ilustracao.svg"
                alt=""
                className="h-auto w-full max-h-[14rem] object-contain object-bottom sm:max-h-[18rem] lg:max-h-[26rem] lg:w-auto lg:max-w-full"
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

function CvmBanner(): ReactNode {
  return (
    <section className="bg-white pb-16 pt-12 lg:pb-20 lg:pt-16" data-analytics-section="cvm-banner">
      <div className="flex justify-center px-4">
        <AnimateIn className="w-[73%]">
          <div className="flex w-full flex-col items-start gap-5 rounded-[16px] bg-[#001F4E] px-6 py-[1.8rem] shadow-[0_8px_32px_rgb(0_0_0_/_0.12)] sm:flex-row sm:items-center sm:gap-7 sm:px-10 sm:py-9 lg:gap-9 lg:px-12">
            <svg width="93" height="89" viewBox="0 0 93 89" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-[4.6rem] w-[4.8rem] shrink-0 sm:h-[5.5rem] sm:w-[5.8rem]" aria-hidden="true">
              <g clipPath="url(#clip0_40_5364_qs)">
                <path d="M62.3359 29.8081C63.3367 30.5945 63.5511 32.0242 62.8363 33.025L44.608 58.0451C44.1791 58.5455 43.6072 58.9029 42.9639 58.9744C42.249 58.9744 41.6057 58.76 41.1053 58.331L32.0269 49.2523C31.1691 48.323 31.1691 46.8933 32.0269 45.964C32.9562 45.1061 34.3859 45.1061 35.3151 45.964L42.4635 53.184L59.1191 30.3085C59.9054 29.3077 61.3351 29.0933 62.3359 29.8081Z" fill="#D2A047" />
                <path d="M42.8209 59.8322C42.0346 59.8322 41.2483 59.5462 40.6049 58.9744L31.455 49.8242C30.2398 48.5374 30.2398 46.5358 31.455 45.3205C32.7417 44.1053 34.7433 44.1053 35.9585 45.3205L42.4635 51.8258L58.4758 29.8081C59.548 28.3784 61.4781 28.0924 62.9078 29.0932C64.2659 30.237 64.5519 32.1671 63.5511 33.5254L45.3228 58.5454C44.6795 59.3318 43.8931 59.7607 43.0353 59.8322C42.9639 59.8322 42.8209 59.8322 42.7494 59.8322H42.8209ZM33.671 46.1784C33.3136 46.1784 32.9562 46.3213 32.5988 46.6073C32.0984 47.1077 32.0984 48.037 32.5988 48.6089L41.6772 57.6876C41.6772 57.6876 42.3205 58.1165 42.8209 58.045C43.1783 58.045 43.5357 57.7591 43.8931 57.4017L62.05 32.4531C62.4789 31.8812 62.3359 30.9519 61.764 30.5229C61.1207 30.094 60.2629 30.237 59.834 30.8804L42.6064 54.6137L34.6718 46.6073C34.6718 46.6073 34.0284 46.2499 33.671 46.2499V46.1784Z" fill="#D2A047" />
                <path d="M59.0453 89.0001C56.6864 89.0001 54.3274 87.7133 52.04 86.4981C50.1099 85.4258 48.0369 84.3535 46.4643 84.3535C44.8916 84.3535 42.8901 85.4258 40.8885 86.4981C38.0292 88.0708 35.0269 89.6434 32.0961 88.7141C29.0223 87.7133 27.5211 84.5679 26.0915 81.5655C25.1622 79.6354 24.2329 77.6338 23.0177 76.776C21.8025 75.9181 19.5865 75.6322 17.442 75.2748C14.1537 74.8459 10.7225 74.3455 8.86395 71.8435C7.00538 69.3414 7.64873 65.9101 8.2206 62.6933C8.57802 60.5487 9.00692 58.3326 8.57802 56.8314C8.14912 55.4732 6.57648 53.972 5.00384 52.5422C2.64489 50.3262 0 47.8242 0 44.5358C0 41.2475 2.64489 38.7455 5.00384 36.5294C6.57648 35.0997 8.14912 33.527 8.57802 32.2402C9.0784 30.8105 8.57802 28.523 8.2206 26.3784C7.64873 23.09 7.00538 19.7302 8.86395 17.2282C10.7225 14.6547 14.1537 14.2258 17.442 13.7969C19.5865 13.5109 21.8025 13.225 23.0177 12.2957C24.2329 11.4378 25.1622 9.43622 26.0915 7.5061C27.5211 4.50369 29.0223 1.35831 32.0961 0.357507C35.0269 -0.571811 38.0292 1.00088 40.8885 2.57357C42.8186 3.64586 44.8916 4.71815 46.4643 4.71815C48.0369 4.71815 50.0384 3.64586 52.04 2.57357C54.8993 1.00088 57.9016 -0.571811 60.8324 0.357507C63.9062 1.35831 65.4074 4.50369 66.837 7.5061C67.7663 9.43622 68.6956 11.4378 69.9108 12.2957C71.1261 13.1535 73.342 13.4394 75.4865 13.7969C78.7748 14.2258 82.206 14.7262 84.0646 17.2282C85.9231 19.7302 85.2798 23.1615 84.7079 26.3784C84.3505 28.523 83.9216 30.739 84.3505 32.2402C84.7794 33.5985 86.352 35.0997 87.9247 36.5294C90.2836 38.7455 92.9285 41.2475 92.9285 44.5358C92.9285 47.8242 90.2836 50.3262 87.9247 52.5422C86.352 53.972 84.7794 55.5447 84.3505 56.8314C83.8501 58.2611 84.3505 60.4772 84.7079 62.6933C85.2798 65.9816 85.9231 69.3414 84.0646 71.8435C82.206 74.4169 78.7748 74.8459 75.4865 75.2748C73.342 75.5607 71.1261 75.8467 69.9108 76.7045C68.6956 77.5623 67.7663 79.5639 66.837 81.494C65.4074 84.4965 63.9062 87.6418 60.8324 88.6426C60.2606 88.8571 59.6172 88.9286 58.9739 88.9286L59.0453 89.0001ZM46.4643 80.7792C48.9662 80.7792 51.3966 82.0659 53.7556 83.3527C55.9716 84.5679 58.259 85.7832 59.7602 85.2828C61.3328 84.7824 62.4766 82.3519 63.6203 79.9928C64.764 77.6338 65.9078 75.2033 67.8378 73.8451C69.7679 72.4153 72.4842 72.0579 75.0576 71.7005C77.6311 71.343 80.2759 70.9856 81.2052 69.6989C82.1345 68.4121 81.7056 65.7672 81.2052 63.2651C80.7048 60.6916 80.2759 57.9752 80.9908 55.6876C81.7056 53.4716 83.6357 51.6129 85.4942 49.8973C87.4243 48.1101 89.3543 46.18 89.3543 44.4643C89.3543 42.7487 87.3528 40.89 85.4942 39.0314C83.6357 37.2443 81.7056 35.4571 80.9908 33.241C80.2759 30.9535 80.7048 28.237 81.2052 25.6635C81.6341 23.1615 82.1345 20.5165 81.2052 19.2298C80.2759 17.943 77.6311 17.5856 75.0576 17.2282C72.4842 16.8708 69.7679 16.5133 67.8378 15.0836C65.9078 13.7254 64.764 11.2949 63.6203 8.93582C62.4766 6.57678 61.3328 4.14626 59.7602 3.64586C58.259 3.14546 55.9716 4.43221 53.7556 5.57598C51.3966 6.86273 48.9662 8.14947 46.4643 8.14947C43.9623 8.14947 41.5319 6.86273 39.1729 5.57598C36.957 4.36072 34.598 3.14546 33.1683 3.64586C31.5957 4.14626 30.452 6.57678 29.3082 8.93582C28.1645 11.2949 27.0208 13.7254 25.0907 15.0836C23.1606 16.5133 20.4443 16.8708 17.8709 17.2282C15.2975 17.5856 12.6526 17.943 11.7233 19.2298C10.794 20.5165 11.2229 23.1615 11.7233 25.6635C12.2237 28.237 12.6526 30.9535 11.9377 33.241C11.2229 35.4571 9.29285 37.2443 7.43428 39.0314C5.50423 40.8186 3.57417 42.7487 3.57417 44.4643C3.57417 46.18 5.57571 48.0386 7.43428 49.8973C9.29285 51.6844 11.2229 53.4716 11.9377 55.6876C12.6526 57.9752 12.2237 60.6916 11.7233 63.2651C11.2944 65.7672 10.794 68.4121 11.7233 69.6989C12.6526 71.0571 15.2975 71.343 17.8709 71.7005C20.4443 72.0579 23.1606 72.4153 25.0907 73.8451C27.0208 75.2033 28.1645 77.6338 29.3082 79.9928C30.452 82.3519 31.5957 84.7824 33.1683 85.2828C34.6695 85.7832 36.957 84.4965 39.1729 83.3527C41.5319 82.0659 43.9623 80.7792 46.4643 80.7792Z" fill="#D2A047" />
              </g>
              <defs>
                <clipPath id="clip0_40_5364_qs">
                  <rect width="93" height="89" fill="white" />
                </clipPath>
              </defs>
            </svg>
            <div className="w-full min-w-0 flex-1 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-[0.42em] text-[#D2A047] sm:text-[11px] sm:tracking-[0.48em]">
                Uma operação dentro das regras
              </p>
              <h2 className="mt-1.5 text-xl font-extrabold uppercase leading-tight tracking-[0.04em] text-white sm:text-2xl lg:text-[1.75rem]">
                Regulada pela CVM — Resolução 88
              </h2>
              <p className="mt-2.5 text-[0.74375rem] leading-relaxed text-white sm:text-[0.796875rem]">
                A Atlas Hub opera como plataforma de crowdfunding de investimento regulada pela Comissão de Valores Mobiliários, sob a Resolução CVM 88.
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
    { src: "/swiss.svg", alt: "Swiss Capital", className: "h-[7.6rem] w-auto max-w-[15.2rem] object-contain sm:h-[8.85rem] sm:max-w-[17.7rem]" },
    { src: "/advogados.svg", alt: "Wilson & Pinheiro Advogados", className: "h-[6.35rem] w-auto max-w-[19rem] object-contain sm:h-[7.6rem] sm:max-w-[22.8rem]" },
  ];

  return (
    <section className="bg-[#D5A650] py-[5.18rem] lg:py-[6.2rem]" data-analytics-section="parceiros">
      <div className="lp-container flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:gap-12">
        <AnimateIn className="shrink-0 text-center lg:text-left">
          <h2 className="max-w-md text-[1.75rem] font-extrabold leading-tight tracking-tight text-[#6C4C14] uppercase sm:text-[2.15rem] lg:text-[2.25rem]">
            Equipe
            <br />
            responsável
            <br />
            pela curadoria
          </h2>
        </AnimateIn>
        <AnimateIn delay={80} className="flex flex-1 flex-wrap items-center justify-center gap-10 sm:gap-12 lg:justify-center xl:gap-16">
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
      <CvmBanner />
      <Parceiros />
    </MarketingShell>
  );
}
