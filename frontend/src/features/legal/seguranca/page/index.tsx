import type { ReactNode } from "react";
import { LegalPage } from "@/features/legal/components/legal-page";

export default function SegurancaPage(): ReactNode {
  return (
    <LegalPage
      title="Segurança da Informação"
      intro="A Atlas Hub adota medidas técnicas e organizacionais para proteger dados, contas e informações compartilhadas na plataforma."
      sections={[
        {
          title: "Proteção de acesso",
          paragraphs: [
            "O acesso à conta depende de autenticação. Recomendamos senhas únicas, fortes e não compartilhadas, além de manter os dispositivos e e-mails de recuperação atualizados.",
          ],
        },
        {
          title: "Dados e infraestrutura",
          paragraphs: [
            "Dados são armazenados em serviços de nuvem com controles de acesso, criptografia em trânsito quando aplicável e registro de operações. Acesso interno é limitado às pessoas que precisam tratar a informação.",
          ],
        },
        {
          title: "Responsabilidades do usuário",
          paragraphs: [
            "Você é responsável por manter suas credenciais em segurança e por comunicar imediatamente qualquer suspeita de acesso não autorizado, fraude ou uso indevido da conta.",
          ],
        },
        {
          title: "Incidentes e contato",
          paragraphs: [
            "Suspeitas de incidentes de segurança devem ser comunicadas para contato@atlascomp.com.br. A Atlas Hub avaliará o caso e adotará as medidas cabíveis, incluindo comunicações obrigatórias quando aplicável.",
          ],
        },
      ]}
    />
  );
}
