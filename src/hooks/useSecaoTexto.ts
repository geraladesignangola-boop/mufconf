import { useEffect, useState } from 'react';
import {
  fetchPublicSecoes,
  PublicSecaoTexto,
} from '../services/publicDataService';

/**
 * Devolve o texto (título / subtítulo / descrição) de uma secção da landing
 * page tal como está gravado no painel admin, ou `null` ainda não estiver
 * disponível (a secção continua a mostrar o texto embutido no código).
 */
export function useSecaoTexto(chave: string): PublicSecaoTexto | null {
  const [texto, setTexto] = useState<PublicSecaoTexto | null>(null);

  useEffect(() => {
    let ativo = true;
    fetchPublicSecoes()
      .then((map) => {
        if (ativo) setTexto(map[chave] || null);
      })
      .catch(() => {
        // mantém o texto embutido no código
      });
    return () => {
      ativo = false;
    };
  }, [chave]);

  return texto;
}
