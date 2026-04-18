/*
  ItemDiscountRow — linha do painel "Descontos individuais".
  ───────────────────────────────────────────────────────────

  Cada item selecionado para a promoção ganha uma linha desta:
  imagem + título + input numérico de % + botão Confirmar + badge.

  Por que existe um botão "Confirmar" em vez de aplicar on-change?

    - Editar um número (digitar/clamp/apagar) costuma passar por
      valores intermediários que não fazem sentido aplicar (ex: usuário
      apaga "20" para digitar "30" e o estado vira "" momentaneamente).
    - O Modal de confirmação reforça que aquilo é uma ação que altera
      o preço visto pelo cliente final — coerente com o tom de "painel
      admin" da página.

  O input é controlado e CLAMPADO no onChange entre 1 e MAX_PROMO_DISCOUNT.
  O valor 0 é permitido apenas como "estado inicial" do back-end (item
  selecionado mas sem desconto definido) — daí o min do range válido
  para validação ser 0.
 */

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal/Modal'
import { applyDiscount, formatPrice, truncateText } from '@/utils/formatters'
import { MAX_PROMO_DISCOUNT } from '@/utils/constants'
import styles from './Promotions.module.css'

export function ItemDiscountRow({ item, onConfirm }) {
  const [inputValue, setInputValue] = useState(item.discount)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const isDirty = Number(inputValue) !== item.discount
  const pendingDiscount = Number(inputValue)
  const isValid = !isNaN(pendingDiscount) && pendingDiscount >= 0 && pendingDiscount <= MAX_PROMO_DISCOUNT

  const handleChange = (e) => {
    const raw = e.target.value
    if (raw === '') { setInputValue(''); return }
    const clamped = Math.min(MAX_PROMO_DISCOUNT, Math.max(1, Number(raw)))
    setInputValue(clamped)
  }

  const handleConfirmClick = () => {
    if (!isDirty || !isValid) return
    setConfirmOpen(true)
  }

  const handleApply = () => {
    onConfirm(item.id, pendingDiscount)
    setConfirmOpen(false)
  }

  const handleCancel = () => setConfirmOpen(false)

  return (
    <>
      <div className={styles.discountRow}>
        <img src={item.image} alt={item.title} className={styles.discountRowImg} />

        <span className={styles.discountRowTitle}>{truncateText(item.title, 40)}</span>

        <div className={`${styles.discountInputWrapper} ${isDirty ? styles.discountInputDirty : ''}`}>
          <input
            type="number"
            min="1"
            max={MAX_PROMO_DISCOUNT}
            value={inputValue}
            onChange={handleChange}
            className={styles.discountInput}
            aria-label={`Desconto para ${item.title}`}
          />
          <span className={styles.discountSymbol}>%</span>
        </div>

        <button
          className={styles.confirmBtn}
          onClick={handleConfirmClick}
          disabled={!isDirty || inputValue === '' || !isValid}
        >
          Confirmar
        </button>

        {item.discount > 0 && (
          <span className={styles.activeDiscountBadge}>Ativo: -{item.discount}%</span>
        )}
      </div>

      <Modal isOpen={confirmOpen} onClose={handleCancel} title="Confirmar desconto">
        <div className={styles.modalContent}>
          <div className={styles.modalIcon}>🏷️</div>
          <p className={styles.modalText}>
            Você está prestes a aplicar um desconto de{' '}
            <strong className={styles.modalHighlight}>-{pendingDiscount}%</strong>{' '}
            para o produto:
          </p>
          <p className={styles.modalProductName}>{item.title}</p>
          <div className={styles.modalPricePreview}>
            <span className={styles.modalOriginalPrice}>{formatPrice(item.price)}</span>
            <span className={styles.modalArrow}>→</span>
            <span className={styles.modalFinalPrice}>
              {formatPrice(applyDiscount(item.price, pendingDiscount))}
            </span>
          </div>
          <div className={styles.modalActions}>
            <button className={styles.modalCancelBtn} onClick={handleCancel}>
              Cancelar
            </button>
            <button className={styles.modalConfirmBtn} onClick={handleApply}>
              Confirmar desconto
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
