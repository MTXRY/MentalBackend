const { supabase } = require('../config/supabase');

/**
 * Payment Progress Service
 * Tracks and manages payment progress through different stages
 */

class PaymentProgressService {
  /**
   * Get payment progress stages
   */
  getPaymentStages() {
    return [
      {
        stage: 'initialized',
        label: 'Payment Initialized',
        description: 'Payment has been created and is ready',
        status: 'pending',
        order: 1
      },
      {
        stage: 'instructions_sent',
        label: 'Payment Instructions Sent',
        description: 'Payment details have been provided',
        status: 'pending',
        order: 2
      },
      {
        stage: 'payment_pending',
        label: 'Awaiting Payment',
        description: 'Waiting for payment from GCash/PayMaya',
        status: 'pending',
        order: 3
      },
      {
        stage: 'payment_processing',
        label: 'Processing Payment',
        description: 'Payment is being verified',
        status: 'processing',
        order: 4
      },
      {
        stage: 'payment_verified',
        label: 'Payment Verified',
        description: 'Payment has been confirmed',
        status: 'completed',
        order: 5
      },
      {
        stage: 'payment_completed',
        label: 'Payment Completed',
        description: 'Payment successfully completed',
        status: 'completed',
        order: 6
      }
    ];
  }

  /**
   * Get current payment progress
   */
  async getPaymentProgress(paymentId) {
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error || !payment) {
      throw new Error('Payment not found');
    }

    const stages = this.getPaymentStages();
    const currentStage = this.determineCurrentStage(payment);
    
    // Map stages with progress status
    const progressStages = stages.map((stage, index) => {
      const stageOrder = this.getStageOrder(stage.stage);
      const currentOrder = this.getStageOrder(currentStage);
      
      let status = 'pending';
      if (stageOrder < currentOrder) {
        status = 'completed';
      } else if (stageOrder === currentOrder) {
        status = payment.payment_status === 'completed' ? 'completed' : 
                 payment.payment_status === 'processing' ? 'processing' : 'current';
      }

      return {
        ...stage,
        status,
        isCurrent: stageOrder === currentOrder,
        isCompleted: stageOrder < currentOrder,
        timestamp: this.getStageTimestamp(payment, stage.stage)
      };
    });

    return {
      payment_id: payment.id,
      current_stage: currentStage,
      current_status: payment.payment_status,
      progress_percentage: this.calculateProgressPercentage(currentStage),
      stages: progressStages,
      payment_details: {
        amount: payment.amount,
        currency: payment.currency,
        payment_method: payment.payment_method,
        transaction_id: payment.transaction_id,
        reference_number: payment.payment_intent_id,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
        paid_at: payment.paid_at
      }
    };
  }

  /**
   * Determine current stage based on payment status
   */
  determineCurrentStage(payment) {
    switch (payment.payment_status) {
      case 'pending':
        if (payment.payment_intent_id) {
          return 'payment_pending';
        }
        return 'initialized';
      case 'processing':
        return 'payment_processing';
      case 'completed':
        return 'payment_completed';
      case 'failed':
      case 'cancelled':
        return 'payment_pending';
      default:
        return 'initialized';
    }
  }

  /**
   * Get stage order number
   */
  getStageOrder(stage) {
    const orderMap = {
      'initialized': 1,
      'instructions_sent': 2,
      'payment_pending': 3,
      'payment_processing': 4,
      'payment_verified': 5,
      'payment_completed': 6
    };
    return orderMap[stage] || 0;
  }

  /**
   * Calculate progress percentage
   */
  calculateProgressPercentage(currentStage) {
    const totalStages = 6;
    const currentOrder = this.getStageOrder(currentStage);
    return Math.round((currentOrder / totalStages) * 100);
  }

  /**
   * Get timestamp for a specific stage
   */
  getStageTimestamp(payment, stage) {
    switch (stage) {
      case 'initialized':
        return payment.created_at;
      case 'payment_completed':
        return payment.paid_at || payment.updated_at;
      default:
        return payment.updated_at;
    }
  }

  /**
   * Update payment progress
   */
  async updatePaymentProgress(paymentId, stage, metadata = {}) {
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error || !payment) {
      throw new Error('Payment not found');
    }

    // Update payment metadata with progress information
    const updatedMetadata = {
      ...(payment.metadata || {}),
      progress: {
        current_stage: stage,
        updated_at: new Date().toISOString(),
        ...metadata
      }
    };

    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update payment progress: ${updateError.message}`);
    }

    return updatedPayment;
  }

  /**
   * Get payment timeline/activity log
   */
  async getPaymentTimeline(paymentId) {
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error || !payment) {
      throw new Error('Payment not found');
    }

    const timeline = [
      {
        event: 'Payment Initialized',
        description: `Payment of ₱${payment.amount.toFixed(2)} initialized via ${payment.payment_method.toUpperCase()}`,
        timestamp: payment.created_at,
        status: 'completed'
      }
    ];

    if (payment.payment_intent_id) {
      timeline.push({
        event: 'Payment Instructions Provided',
        description: `Reference number: ${payment.payment_intent_id}`,
        timestamp: payment.created_at,
        status: 'completed'
      });
    }

    if (payment.payment_status === 'processing') {
      timeline.push({
        event: 'Payment Processing',
        description: 'Payment is being verified with payment gateway',
        timestamp: payment.updated_at,
        status: 'processing'
      });
    }

    if (payment.payment_status === 'completed' && payment.paid_at) {
      timeline.push({
        event: 'Payment Completed',
        description: `Payment successfully completed at ${new Date(payment.paid_at).toLocaleString()}`,
        timestamp: payment.paid_at,
        status: 'completed'
      });
    }

    if (payment.payment_status === 'failed' && payment.failure_reason) {
      timeline.push({
        event: 'Payment Failed',
        description: payment.failure_reason,
        timestamp: payment.updated_at,
        status: 'failed'
      });
    }

    return timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
}

module.exports = new PaymentProgressService();

