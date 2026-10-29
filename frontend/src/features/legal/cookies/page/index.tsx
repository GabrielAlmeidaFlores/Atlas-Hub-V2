import type { ReactNode } from "react";
import { LegalPage } from "@/features/legal/components/legal-page";

export default function CookiesPage(): ReactNode {
  return (
    <LegalPage
      title="Política de Cookies"
      intro="Esta Política explica como a Atlas Hub utiliza cookies e tecnologias semelhantes para operar a plataforma, medir audiência e melhorar a experiência."
      sections={[
        {
          title: "O que são cookies",
          paragraphs: [
            "Cookies são pequenos arquivos armazenados no navegador ou dispositivo. Eles permitem reconhecer uma sessão, manter preferências e entender como as páginas são utilizadas.",
          ],
        },
        {
          title: "Cookies essenciais",
          paragraphs: [
            "São necessários para autenticação, segurança, funcionamento do formulário e recursos básicos da plataforma. Sem eles, parte dos serviços pode não funcionar corretamente.",
          ],
        },
        {
          title: "Cookies analíticos",
          paragraphs: [
            "Podem ser usados para medir acessos, páginas visitadas, origem do tráfego e desempenho da plataforma, ajudando a identificar problemas e melhorar a experiência.",
          ],
        },
        {
          title: "Cookies de marketing",
          paragraphs: [
            "Quando autorizados, podem apoiar a mensuração de campanhas e a apresentação de conteúdos ou anúncios mais relevantes. O consentimento pode ser alterado ou revogado.",
          ],
        },
        {
          title: "Gerenciamento",
          paragraphs: [
            "Você pode bloquear ou remover cookies nas configurações do navegador. O bloqueio de cookies essenciais pode afetar o login e outras funcionalidades da plataforma.",
          ],
        },
      ]}
    />
  );
}
