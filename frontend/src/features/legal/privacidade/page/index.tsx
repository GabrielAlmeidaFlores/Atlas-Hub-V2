import type { ReactNode } from "react";
import { LegalPage } from "@/features/legal/components/legal-page";

export default function PrivacidadePage(): ReactNode {
  return (
    <LegalPage
      title="Política de Privacidade"
      intro="Esta Política explica como a Atlas Hub coleta, utiliza, compartilha e protege dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD)."
      sections={[
        {
          title: "Controlador e contato",
          paragraphs: [
            "O controlador dos dados tratados na plataforma é a Atlas Hub, CNPJ 68.693.823/0001-83. Solicitações relacionadas à privacidade podem ser enviadas para contato@atlascomp.com.br.",
          ],
        },
        {
          title: "Dados que coletamos",
          paragraphs: [
            "Coletamos dados fornecidos no cadastro, como nome, e-mail, telefone, tipo de conta e consentimentos registrados. Também podemos tratar dados de uso, navegação, dispositivo, origem de acesso e interações com a plataforma.",
            "Quando você se cadastra como incorporadora, podemos receber dados da empresa e do responsável legal necessários para análise cadastral e curadoria.",
          ],
        },
        {
          title: "Finalidades e bases legais",
          paragraphs: [
            "Utilizamos os dados para criar e administrar sua conta, autenticar acessos, prestar suporte, enviar comunicações operacionais, prevenir fraudes, cumprir obrigações legais e regulatórias e melhorar a experiência da plataforma.",
            "O tratamento pode se apoiar na execução de contrato, cumprimento de obrigação legal, legítimo interesse e consentimento, conforme o caso. Comunicações de marketing dependem do consentimento e podem ser canceladas a qualquer momento.",
          ],
        },
        {
          title: "Compartilhamento",
          paragraphs: [
            "Podemos compartilhar dados com parceiros necessários à operação, como a Divify para a jornada regulada de investimento, a Stark Bank para serviços financeiros e fornecedores de infraestrutura, hospedagem, comunicação e análise.",
            "Também podemos compartilhar dados com autoridades quando houver obrigação legal, ordem judicial ou necessidade de proteção de direitos.",
          ],
        },
        {
          title: "Retenção e segurança",
          paragraphs: [
            "Mantemos os dados pelo tempo necessário às finalidades descritas, ao cumprimento de obrigações legais e à defesa de direitos. Adotamos medidas técnicas e organizacionais para proteger as informações contra acesso não autorizado, perda ou alteração.",
            "Nenhum sistema é totalmente imune a incidentes. Caso ocorra um incidente relevante, adotaremos as medidas cabíveis e comunicaremos os titulares e autoridades quando exigido.",
          ],
        },
        {
          title: "Seus direitos",
          paragraphs: [
            "Você pode solicitar confirmação de tratamento, acesso, correção, anonimização, bloqueio, eliminação, portabilidade, informação sobre compartilhamentos e revisão de decisões automatizadas, nos termos da LGPD.",
            "Também pode revogar consentimentos e solicitar a oposição a tratamentos baseados em legítimo interesse, quando aplicável.",
          ],
        },
        {
          title: "Atualizações",
          paragraphs: [
            "Esta Política pode ser atualizada para refletir mudanças na plataforma, nos parceiros ou na legislação. A versão vigente e a data de atualização estarão sempre disponíveis nesta página.",
          ],
        },
      ]}
    />
  );
}
