import React, { useId } from 'react'
import { Modal, Stack } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { Button } from '../Embeds/Button'
import { Radio, RadioGroup } from '@chakra-ui/react'
import Title, { Error } from '../Embeds/Title'
import { CreateUserValidation } from '../../helpers/validate'
import { userInit } from '../../helpers/initialvalues'
import { useForm } from 'react-hook-form'
import { required } from '../Embeds/Title'
import { error, success } from '../../helpers/toasts'
import { useUser } from '../../hooks/api'
import { yupResolver } from '@hookform/resolvers/yup'
import { Input } from '../Embeds/Input'

const CreateUser = ({ show, close }) => {
  const { t } = useTranslation()
  const formId = useId()
  const { add } = useUser()
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm({
    resolver: yupResolver(CreateUserValidation),
    defaultValues: userInit
  })

  const onSubmit = async values => {
    const { username, password, isAdmin } = values
    if (await add({ username, password, isAdmin: isAdmin === 'true' })) {
      success(t('notify-user-create-success'))
      close()
    } else error(t('notify-user-create-failed'))
    reset(userInit)
  }

  return (
    <Modal show={show} onHide={close} backdrop="static" scrollable={true}>
      <Modal.Header style={{ backgroundColor: '#f5f5f5' }} closeButton>
        <Modal.Title>{t('create-user-header')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form id={formId} onSubmit={handleSubmit(onSubmit)}>
          <Input id='username' title={required(t('username'))} {...register('username')} />
          {errors.username && <Error>{t(errors.username.message)}</Error>}
          <Input id='password' title={required(t('password'))} type='password' {...register('password')} />
          {errors.password && <Error>{t(errors.password.message)}</Error>}
          <Input id='confirm' title={required(t('confirm'))} type='password' {...register('confirm')} />
          {errors.confirm && <Error>{t(errors.confirm.message)}</Error>}
          <Title>{required(t('user-role'))}</Title>
          <RadioGroup onChange={v => setValue('isAdmin', v)} value={watch('isAdmin')}>
            <Stack direction='col'>
              <Radio value='true'>{t('admin')}</Radio>
              <Radio value='false'>{t('employee')}</Radio>
            </Stack>
          </RadioGroup>
        </form>
      </Modal.Body>
      <Modal.Footer style={{ backgroundColor: '#f5f5f5' }}>
        <Button form={formId} className='active' type='submit'>{t('create-user')}</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default CreateUser