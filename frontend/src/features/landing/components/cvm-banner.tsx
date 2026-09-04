import { type ReactNode, useState } from "react";
import { Info } from "lucide-react";
import { AnimateIn } from "@/components/animate-in";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

export function CvmBanner({
  sectionClassName,
  shellClassName,
}: {
  readonly sectionClassName?: string;
  readonly shellClassName?: string;
}): ReactNode {
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <section
      className={cn("bg-white pb-12 pt-2 sm:pb-16 sm:pt-0 lg:pb-20", sectionClassName)}
      data-analytics-section="cvm-banner"
    >
      <div className="flex justify-center px-4">
        <AnimateIn className={cn("w-full sm:w-[73%]", shellClassName)}>
          <div className="relative flex w-full flex-col items-center gap-5 rounded-[20px] bg-[#001F4E] px-6 py-8 text-center shadow-[0_8px_32px_rgb(0_0_0_/_0.12)] sm:flex-row sm:items-center sm:rounded-[16px] sm:px-10 sm:py-9 sm:text-left lg:gap-9 lg:px-12">
            <button
              type="button"
              aria-label="Mais informações sobre a Resolução CVM 88"
              onClick={() => setInfoOpen(true)}
              className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition-opacity hover:opacity-80 sm:right-4 sm:top-4"
            >
              <Info className="h-7 w-7" strokeWidth={2} />
            </button>
            <svg
              width="93"
              height="89"
              viewBox="0 0 93 89"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto h-[4.2rem] w-[4.4rem] shrink-0 sm:mx-0 sm:h-[5.5rem] sm:w-[5.8rem]"
              aria-hidden="true"
            >
              <g clipPath="url(#clip0_cvm_banner)">
                <path
                  d="M62.3359 29.8081C63.3367 30.5945 63.5511 32.0242 62.8363 33.025L44.608 58.0451C44.1791 58.5455 43.6072 58.9029 42.9639 58.9744C42.249 58.9744 41.6057 58.76 41.1053 58.331L32.0269 49.2523C31.1691 48.323 31.1691 46.8933 32.0269 45.964C32.9562 45.1061 34.3859 45.1061 35.3151 45.964L42.4635 53.184L59.1191 30.3085C59.9054 29.3077 61.3351 29.0933 62.3359 29.8081Z"
                  fill="#D2A047"
                />
                <path
                  d="M42.8209 59.8322C42.0346 59.8322 41.2483 59.5462 40.6049 58.9744L31.455 49.8242C30.2398 48.5374 30.2398 46.5358 31.455 45.3205C32.7417 44.1053 34.7433 44.1053 35.9585 45.3205L42.4635 51.8258L58.4758 29.8081C59.548 28.3784 61.4781 28.0924 62.9078 29.0932C64.2659 30.237 64.5519 32.1671 63.5511 33.5254L45.3228 58.5454C44.6795 59.3318 43.8931 59.7607 43.0353 59.8322C42.9639 59.8322 42.8209 59.8322 42.7494 59.8322H42.8209ZM33.671 46.1784C33.3136 46.1784 32.9562 46.3213 32.5988 46.6073C32.0984 47.1077 32.0984 48.037 32.5988 48.6089L41.6772 57.6876C41.6772 57.6876 42.3205 58.1165 42.8209 58.045C43.1783 58.045 43.5357 57.7591 43.8931 57.4017L62.05 32.4531C62.4789 31.8812 62.3359 30.9519 61.764 30.5229C61.1207 30.094 60.2629 30.237 59.834 30.8804L42.6064 54.6137L34.6718 46.6073C34.6718 46.6073 34.0284 46.2499 33.671 46.2499V46.1784Z"
                  fill="#D2A047"
                />
                <path
                  d="M59.0453 89.0001C56.6864 89.0001 54.3274 87.7133 52.04 86.4981C50.1099 85.4258 48.0369 84.3535 46.4643 84.3535C44.8916 84.3535 42.8901 85.4258 40.8885 86.4981C38.0292 88.0708 35.0269 89.6434 32.0961 88.7141C29.0223 87.7133 27.5211 84.5679 26.0915 81.5655C25.1622 79.6354 24.2329 77.6338 23.0177 76.776C21.8025 75.9181 19.5865 75.6322 17.442 75.2748C14.1537 74.8459 10.7225 74.3455 8.86395 71.8435C7.00538 69.3414 7.64873 65.9101 8.2206 62.6933C8.57802 60.5487 9.00692 58.3326 8.57802 56.8314C8.14912 55.4732 6.57648 53.972 5.00384 52.5422C2.64489 50.3262 0 47.8242 0 44.5358C0 41.2475 2.64489 38.7455 5.00384 36.5294C6.57648 35.0997 8.14912 33.527 8.57802 32.2402C9.0784 30.8105 8.57802 28.523 8.2206 26.3784C7.64873 23.09 7.00538 19.7302 8.86395 17.2282C10.7225 14.6547 14.1537 14.2258 17.442 13.7969C19.5865 13.5109 21.8025 13.225 23.0177 12.2957C24.2329 11.4378 25.1622 9.43622 26.0915 7.5061C27.5211 4.50369 29.0223 1.35831 32.0961 0.357507C35.0269 -0.571811 38.0292 1.00088 40.8885 2.57357C42.8186 3.64586 44.8916 4.71815 46.4643 4.71815C48.0369 4.71815 50.0384 3.64586 52.04 2.57357C54.8993 1.00088 57.9016 -0.571811 60.8324 0.357507C63.9062 1.35831 65.4074 4.50369 66.837 7.5061C67.7663 9.43622 68.6956 11.4378 69.9108 12.2957C71.1261 13.1535 73.342 13.4394 75.4865 13.7969C78.7748 14.2258 82.206 14.7262 84.0646 17.2282C85.9231 19.7302 85.2798 23.1615 84.7079 26.3784C84.3505 28.523 83.9216 30.739 84.3505 32.2402C84.7794 33.5985 86.352 35.0997 87.9247 36.5294C90.2836 38.7455 92.9285 41.2475 92.9285 44.5358C92.9285 47.8242 90.2836 50.3262 87.9247 52.5422C86.352 53.972 84.7794 55.5447 84.3505 56.8314C83.8501 58.2611 84.3505 60.4772 84.7079 62.6933C85.2798 65.9816 85.9231 69.3414 84.0646 71.8435C82.206 74.4169 78.7748 74.8459 75.4865 75.2748C73.342 75.5607 71.1261 75.8467 69.9108 76.7045C68.6956 77.5623 67.7663 79.5639 66.837 81.494C65.4074 84.4965 63.9062 87.6418 60.8324 88.6426C60.2606 88.8571 59.6172 88.9286 58.9739 88.9286L59.0453 89.0001ZM46.4643 80.7792C48.9662 80.7792 51.3966 82.0659 53.7556 83.3527C55.9716 84.5679 58.259 85.7832 59.7602 85.2828C61.3328 84.7824 62.4766 82.3519 63.6203 79.9928C64.764 77.6338 65.9078 75.2033 67.8378 73.8451C69.7679 72.4153 72.4842 72.0579 75.0576 71.7005C77.6311 71.343 80.2759 70.9856 81.2052 69.6989C82.1345 68.4121 81.7056 65.7672 81.2052 63.2651C80.7048 60.6916 80.2759 57.9752 80.9908 55.6876C81.7056 53.4716 83.6357 51.6129 85.4942 49.8973C87.4243 48.1101 89.3543 46.18 89.3543 44.4643C89.3543 42.7487 87.3528 40.89 85.4942 39.0314C83.6357 37.2443 81.7056 35.4571 80.9908 33.241C80.2759 30.9535 80.7048 28.237 81.2052 25.6635C81.6341 23.1615 82.1345 20.5165 81.2052 19.2298C80.2759 17.943 77.6311 17.5856 75.0576 17.2282C72.4842 16.8708 69.7679 16.5133 67.8378 15.0836C65.9078 13.7254 64.764 11.2949 63.6203 8.93582C62.4766 6.57678 61.3328 4.14626 59.7602 3.64586C58.259 3.14546 55.9716 4.43221 53.7556 5.57598C51.3966 6.86273 48.9662 8.14947 46.4643 8.14947C43.9623 8.14947 41.5319 6.86273 39.1729 5.57598C36.957 4.36072 34.598 3.14546 33.1683 3.64586C31.5957 4.14626 30.452 6.57678 29.3082 8.93582C28.1645 11.2949 27.0208 13.7254 25.0907 15.0836C23.1606 16.5133 20.4443 16.8708 17.8709 17.2282C15.2975 17.5856 12.6526 17.943 11.7233 19.2298C10.794 20.5165 11.2229 23.1615 11.7233 25.6635C12.2237 28.237 12.6526 30.9535 11.9377 33.241C11.2229 35.4571 9.29285 37.2443 7.43428 39.0314C5.50423 40.8186 3.57417 42.7487 3.57417 44.4643C3.57417 46.18 5.57571 48.0386 7.43428 49.8973C9.29285 51.6844 11.2229 53.4716 11.9377 55.6876C12.6526 57.9752 12.2237 60.6916 11.7233 63.2651C11.2944 65.7672 10.794 68.4121 11.7233 69.6989C12.6526 71.0571 15.2975 71.343 17.8709 71.7005C20.4443 72.0579 23.1606 72.4153 25.0907 73.8451C27.0208 75.2033 28.1645 77.6338 29.3082 79.9928C30.452 82.3519 31.5957 84.7824 33.1683 85.2828C34.6695 85.7832 36.957 84.4965 39.1729 83.3527C41.5319 82.0659 43.9623 80.7792 46.4643 80.7792Z"
                  fill="#D2A047"
                />
              </g>
              <defs>
                <clipPath id="clip0_cvm_banner">
                  <rect width="93" height="89" fill="white" />
                </clipPath>
              </defs>
            </svg>
            <div className="w-full min-w-0 flex-1 text-center sm:pr-8 sm:text-left">
              <p className="text-[10px] font-semibold uppercase tracking-[0.42em] text-[#D2A047] sm:text-[11px] sm:tracking-[0.48em]">
                Uma operação dentro das regras
              </p>
              <h2 className="mt-1.5 text-xl font-extrabold uppercase leading-tight tracking-[0.04em] text-white sm:text-2xl lg:text-[1.75rem]">
                Regulada pela CVM — Resolução 88
              </h2>
              <p className="mt-2.5 text-[0.74375rem] leading-relaxed text-white sm:text-[0.796875rem]">
                A Atlas Hub opera como plataforma de crowdfunding de investimento regulada pela Comissão de Valores
                Mobiliários, sob a Resolução CVM 88.
              </p>
            </div>
          </div>
        </AnimateIn>
      </div>

      <Modal
        open={infoOpen}
        onOpenChange={setInfoOpen}
        title="Resolução CVM 88"
        description="Informações sobre a regulamentação"
      >
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
            ex ea commodo consequat.
          </p>
          <p>
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est
            laborum.
          </p>
        </div>
      </Modal>
    </section>
  );
}
