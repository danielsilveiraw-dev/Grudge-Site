'use client';

import { useState } from 'react';
import type { RiddleType } from '@/lib/riddles';

type RiddleTypeFieldsProps = {
  idPrefix: string;
  defaultType?: RiddleType;
  defaultClue?: string;
  defaultButtonText?: string;
  defaultUrl?: string;
};

export default function RiddleTypeFields({
  idPrefix,
  defaultType = 'message',
  defaultClue = '',
  defaultButtonText = '',
  defaultUrl = '',
}: RiddleTypeFieldsProps) {
  const [type, setType] = useState<RiddleType>(defaultType);

  const typeId = `${idPrefix}-type`;
  const clueId = `${idPrefix}-clue`;
  const buttonTextId = `${idPrefix}-buttonText`;
  const urlId = `${idPrefix}-url`;

  return (
    <>
      <div>
        <label
          htmlFor={typeId}
          className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
        >
          tipo da postagem
        </label>

        <select
          id={typeId}
          name="type"
          value={type}
          onChange={(event) =>
            setType(event.target.value as RiddleType)
          }
          className="w-full rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
        >
          <option value="message">mensagem</option>
          <option value="link">botão com link</option>
        </select>
      </div>

      {type === 'message' ? (
        <div>
          <label
            htmlFor={clueId}
            className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
          >
            mensagem / pista
          </label>

          <textarea
            id={clueId}
            name="clue"
            rows={4}
            required
            defaultValue={defaultClue}
            placeholder="escreva a charada ou pista aqui..."
            className="w-full resize-y rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
          />
        </div>
      ) : (
        <>
          <div>
            <label
              htmlFor={buttonTextId}
              className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
            >
              texto do botão
            </label>

            <input
              id={buttonTextId}
              name="buttonText"
              type="text"
              required
              defaultValue={defaultButtonText}
              placeholder="ex: acessar o próximo enigma"
              className="w-full rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor={urlId}
              className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-text-dim"
            >
              link do botão
            </label>

            <input
              id={urlId}
              name="url"
              type="text"
              required
              defaultValue={defaultUrl}
              placeholder="https://exemplo.com"
              className="w-full rounded-xl border border-line-soft bg-bg-deep/50 p-3 text-text-main focus:border-accent-hot focus:outline-none"
            />

            <p className="mt-1.5 text-[0.7rem] text-text-dim">
              O botão abrirá esse endereço em uma nova aba.
            </p>
          </div>
        </>
      )}
    </>
  );
}