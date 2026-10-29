import type { ReactNode } from "react";
import { LegalPage } from "@/features/legal/components/legal-page";

export default function ComunicacoesPage(): ReactNode {
  return (
    <LegalPage
      title="Política de Comunicações"
      intro="Esta Política descreve como a Atlas Hub se comunica com incorporadoras, investidores e demais usuários da plataforma."
      sections={[
        {
          title: "Comunicações operacionais",
          paragraphs: [
            "Podemos enviar avisos necessários para a conta e para a operação, como confirmação de cadastro, recuperação de senha, andamento de projetos, comunicados da oferta e informações de segurança.",
            "Essas comunicações são enviadas independentemente de consentimento de marketing quando necessárias para executar o serviço ou cumprir obrigação legal.",
          ],
        },
        {
          title: "Conteúdos e marketing",
          paragraphs: [
            "Quando você autoriza, podemos enviar novidades, conteúdos sobre o mercado imobiliário, oportunidades e comunicações comerciais por e-mail, telefone ou outros canais informados.",
            "O consentimento de marketing é opcional e pode ser revogado a qualquer momento pelos canais de contato ou pelas configurações da conta.",
          ],
        },
        {
          title: "Canais e atualização cadastral",
          paragraphs: [
            "É importante manter e-mail e telefone atualizados. Podemos usar esses dados para contato sobre a conta e para validar comunicações solicitadas por você.",
          ],
        },
        {
          title: "Contato",
          paragraphs: [
            "Solicitações sobre comunicações podem ser enviadas para contato@atlascomp.com.br. Responderemos dentro dos prazos aplicáveis.",
          ],
        },
      ]}
    />
  );
}
