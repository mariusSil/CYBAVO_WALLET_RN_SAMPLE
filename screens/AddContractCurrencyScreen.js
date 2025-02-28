import React, { useState, useEffect, useRef } from 'react';
import { Image, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Container, Content } from 'native-base';
import {
  Coin,
  ROUND_BUTTON_HEIGHT,
  sliderInnerWidth,
  sliderOuterWidth,
} from '../Constants';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useNavigationParam } from 'react-navigation-hooks';
import { withTheme, Text } from 'react-native-paper';
import Styles from '../styles/Styles';
import I18n from '../i18n/i18n';
import { Theme } from '../styles/MainTheme';
import {
  fetchWallets,
  fetchCurrenciesIfNeed,
  fetchCurrencyPricesIfNeed,
  fetchCurrencies,
} from '../store/actions';
import InputPinCodeModal from './InputPinCodeModal';
import CurrencyPicker from '../components/CurrencyPicker';
import {
  checkCameraPermission,
  focusInput,
  focusNext,
  getInfoSvg,
  getRestCurrencies,
  getWalletConnectSvg2,
  hasValue,
  isValidEosAccount,
  sleep,
  toastError,
} from '../Helpers';
import { Wallets } from '@cybavo/react-native-wallet-service';
import Headerbar from '../components/Headerbar';
import RoundButton2 from '../components/RoundButton2';
import CompoundTextInput from '../components/CompoundTextInput';
import ResultModal, {
  TYPE_FAIL,
  TYPE_SUCCESS,
} from '../components/ResultModal';
import DegreeSelecter from '../components/DegreeSelecter';
import NavigationService from '../NavigationService';
import { SvgXml } from 'react-native-svg';
const AddContractCurrencyScreen: () => React$Node = ({ theme }) => {
  const dispatch = useDispatch();
  const { navigate, goBack } = useNavigation();
  const [loading, setLoading] = useState(false);
  const refs = [useRef(), useRef()];
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState(Coin.ETH);
  const [inputPinCode, setInputPinCode] = useState(false);
  const [addressError, setAddressError] = useState(null);
  const [result, setResult] = useState(null);
  const enabledBsc = useSelector(state => {
    if (state.currency.currencies == null) {
      return false;
    }
    for (let i = 0; i < state.currency.currencies.length; i++) {
      if (state.currency.currencies[i].currency == Coin.BSC) {
        return true;
      }
    }
    return false;
  });
  const _setAddress = r => {
    r = r.trim();
    setAddress(r);
    setTimeout(() => {
      if (_checkAddress(r)) {
        refs[0].current.blur();
      } else {
        focusInput(refs, 0);
      }
    }, 500);
  };
  const valueObj = {
    eth: {
      currency: Coin.ETH,
      description: I18n.t('eth_desc'),
    },
    bsc: {
      currency: Coin.BSC,
      description: I18n.t('bsc_desc'),
    },
    one: {
      currency: Coin.ONE,
      description: I18n.t('one_desc'),
    },
  };
  const _goScan = async () => {
    if (await checkCameraPermission()) {
      NavigationService.navigate('scanModal', {
        onResult: _setAddress,
        modal: true,
        scanHint: I18n.t('scan_hint_address_only'),
        disableWalletConnect: true,
      });
    }
  };
  const _checkAddress = value => {
    if (!hasValue(value)) {
      setAddressError(
        I18n.t('error_input_empty', { label: I18n.t('contract_address') })
      );
      return false;
    }
    setAddressError(null);
    return true;
  };
  const _addContractCurrency = async pinSecret => {
    setLoading(true);
    try {
      let result = await Wallets.addContractCurrency(
        currency,
        address,
        pinSecret
      );
      let msg = '';
      if (result.successResults) {
        if (result.successResults.length == 0) {
          msg = I18n.t('token_exist');
        } else {
          dispatch(fetchCurrencies());
          dispatch(fetchWallets());
          msg = I18n.t('collectible_added');
        }
      }
      setResult({
        type: TYPE_SUCCESS,
        title: I18n.t('add_successfully'),
        message: msg,
        buttonClick: () => {
          setResult(null);
          goBack();
        },
      });
    } catch (error) {
      console.log('_addContractCurrency failed', error);
      setResult({
        type: TYPE_FAIL,
        error: I18n.t(`error_msg_${error.code}`, {
          defaultValue: I18n.t('check_if_token_is_valid_nft', error),
        }),
        title: I18n.t('add_failed'),
        buttonClick: () => {
          setResult(null);
        },
      });
    }
    setInputPinCode(false);
    setLoading(false);
  };
  const _submit = () => {
    if (!_checkAddress(address)) {
      return;
    }
    setInputPinCode(true);
  };

  const _onAddressChanged = value => {
    setAddress(value);
    if (addressError) {
      setAddressError(null);
    }
  };
  return (
    <>
      <Container style={Styles.bottomContainer}>
        <Headerbar
          transparent
          title={I18n.t('add_collectible')}
          onBack={() => goBack()}
        />
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={styles.contentContainer}
          contentContainerStyle={{ justifyContent: 'space-between' }}>
          <Text
            style={[
              Styles.secLabel,
              styles.labelItem,
              Theme.fonts.default.regular,
            ]}>
            {I18n.t('blockchain')}
          </Text>

          <DegreeSelecter
            itemStyle={Styles.block}
            keys={enabledBsc ? ['eth', 'bsc', 'one'] : ['eth', 'one']}
            valueObj={valueObj}
            reserveErrorMsg={false}
            style={{ flexDirection: 'row', flex: 1 }}
            onSelect={key => {
              setCurrency(valueObj[key].currency);
            }}
            getLabel={(key = {}) => I18n.t(key, { defaultValue: key })}
            getValue={(item = {}) => item.description}
            // getDesc={(key = {}) => ''}
            line3={false}
          />
          <View
            style={[
              Styles.infoBackground,
              {
                marginHorizontal: 0,
                marginTop: 0,
                marginBottom: 4,
                backgroundColor: Theme.colors.errorInfo16,
                borderColor: Theme.colors.errorInfo,
              },
            ]}>
            <SvgXml xml={getInfoSvg('#E82047')} width={16} height={16} />
            <Text
              style={[
                Theme.fonts.default.regular,
                {
                  textAlign: 'left',
                  marginLeft: 5,
                  paddingRight: 10,
                },
              ]}>
              {I18n.t('different_address_info')}
            </Text>
          </View>
          <Text style={Styles.labelBlock}>{I18n.t('contract_address')}</Text>
          <CompoundTextInput
            ref={refs[0]}
            onSubmitEditing={
              refs[0].current
                ? () => {
                    refs[0].current.blur();
                  }
                : null
            }
            placeholder={I18n.t('to_address_placeholder')}
            style={{ backgroundColor: 'transparent', marginTop: 15 }}
            value={address}
            onClear={() => {
              setAddress('');
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            underlineColor={Theme.colors.normalUnderline}
            hasError={hasValue(addressError)}
            onChangeText={_onAddressChanged}
            errorMsg={addressError}
            goScan={_goScan}
          />
        </ScrollView>
        <View style={{ marginTop: 50 }}>
          <View
            style={[
              Styles.infoBackground,
              { marginHorizontal: 16, marginTop: 0, marginBottom: 4 },
            ]}>
            <Image
              style={{ marginTop: 3 }}
              source={require('../assets/image/ic_Info.png')}
            />
            <Text
              style={[
                Theme.fonts.default.regular,
                {
                  textAlign: 'left',
                  marginLeft: 5,
                  paddingRight: 10,
                },
              ]}>
              {I18n.t('add_currency_info')}
            </Text>
          </View>
          <RoundButton2
            height={ROUND_BUTTON_HEIGHT}
            style={[Styles.bottomButton]}
            labelStyle={[{ color: theme.colors.text, fontSize: 14 }]}
            onPress={_submit}
            disabled={loading}>
            {I18n.t('submit_confirm')}
          </RoundButton2>
        </View>
      </Container>
      <InputPinCodeModal
        title={I18n.t('add_collectible')}
        isVisible={!!inputPinCode}
        onCancel={() => setInputPinCode(false)}
        loading={loading}
        onInputPinCode={_addContractCurrency}
      />
      {result && (
        <ResultModal
          visible={!!result}
          title={result.title}
          message={result.message}
          errorMsg={result.error}
          type={result.type}
          onButtonClick={result.buttonClick}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: 16,
    paddingBottom: 0, // need to make a distance from bottom, to fix abnormal move while focus next TextInput on iOS
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    marginTop: 8,
  },
  labelItem: {
    marginTop: 15,
    marginBottom: 10,
  },
});
export default withTheme(AddContractCurrencyScreen);
